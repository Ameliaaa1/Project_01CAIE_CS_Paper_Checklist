const crypto = require("node:crypto");
const { getPrisma, isUniqueConstraintError } = require("./db");
const { readUsersDb, writeUsersDb } = require("./localStore");
const { hasPaidEntitlement } = require("./purchases");

const DEFAULT_TRANSACTION_RETRY_LIMIT = 4;
const DEFAULT_TRANSACTION_RETRY_BASE_DELAY_MS = 5;
const TRIAL_SEARCH_SOURCE = "question-finder-trial";
const PAID_SEARCH_SOURCE = "question-finder-paid";

function httpError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function isTransactionConflict(error) {
  return Boolean(error && error.code === "P2034");
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function withTransactionRetry(
  operation,
  retryLimit = DEFAULT_TRANSACTION_RETRY_LIMIT,
  options = {}
) {
  const baseDelayMs = Number.isFinite(options.baseDelayMs)
    ? Math.max(0, options.baseDelayMs)
    : DEFAULT_TRANSACTION_RETRY_BASE_DELAY_MS;
  const sleep = options.sleep || wait;
  const onRetry = options.onRetry || (() => {});
  let attempt = 0;
  while (true) {
    try {
      return await operation(attempt);
    } catch (error) {
      if (!isTransactionConflict(error) || attempt >= retryLimit) throw error;
      const delayMs = Math.min(1000, baseDelayMs * (2 ** attempt));
      onRetry({
        errorCode: error.code,
        failedAttempt: attempt,
        nextAttempt: attempt + 1,
        delayMs
      });
      await sleep(delayMs);
      attempt += 1;
    }
  }
}

async function executeQuestionSearchTransaction(operation, options = {}) {
  const retryLimit = Number.isInteger(options.retryLimit)
    ? options.retryLimit
    : DEFAULT_TRANSACTION_RETRY_LIMIT;
  const retryEvents = [];
  let retryCount = 0;
  try {
    const value = await withTransactionRetry(async (attempt) => {
      retryCount = attempt;
      return operation(attempt);
    }, retryLimit, {
      baseDelayMs: options.baseDelayMs,
      sleep: options.sleep,
      onRetry(event) {
        retryEvents.push(event);
        options.eventLogger?.({ event: "P2034_RETRY", ...event });
      }
    });
    return {
      value,
      retryCount,
      metrics: {
        configuredRetryLimit: retryLimit,
        p2002Count: 0,
        p2034Count: retryEvents.length,
        exhaustedRetryCount: 0,
        retryDelaysMs: retryEvents.map((event) => event.delayMs)
      }
    };
  } catch (error) {
    error.transactionMetrics = {
      configuredRetryLimit: retryLimit,
      p2002Count: 0,
      p2034Count: retryEvents.length + (isTransactionConflict(error) ? 1 : 0),
      exhaustedRetryCount: isTransactionConflict(error) ? 1 : 0,
      retryDelaysMs: retryEvents.map((event) => event.delayMs)
    };
    if (isTransactionConflict(error)) {
      options.eventLogger?.({
        event: "P2034_RETRY_EXHAUSTED",
        retryCount,
        retryLimit
      });
    }
    throw error;
  }
}

function toSearch(search, createdNew) {
  return {
    id: search.id,
    userId: search.userId,
    key: search.searchKey,
    source: search.source,
    query: search.query,
    syllabusIds: Array.isArray(search.filters?.syllabusIds) ? search.filters.syllabusIds : [],
    questionIds: Array.isArray(search.questionIds) ? search.questionIds : [],
    createdAt: search.createdAt instanceof Date ? search.createdAt.toISOString() : search.createdAt,
    createdNew
  };
}

async function listQuestionSearches(userId) {
  const prisma = getPrisma();
  if (prisma) {
    const searches = await prisma.questionSearch.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" }
    });
    return searches.map((search) => toSearch(search, false));
  }

  const db = readUsersDb();
  const user = db.users.find((candidate) => candidate.id === userId);
  return Array.isArray(user?.questionFinderSearches)
    ? user.questionFinderSearches.map((search) => ({
      ...search,
      userId: search.userId || userId,
      source: search.source || TRIAL_SEARCH_SOURCE
    }))
    : [];
}

async function findQuestionSearchByKey(userId, key) {
  const searches = await listQuestionSearches(userId);
  return searches.find((search) => search.key === key) || null;
}

async function recordQuestionSearchWithQuota({
  userId,
  key,
  query,
  syllabusIds,
  questionIds,
  resultCount,
  trialLimit,
  transactionRetryLimit = DEFAULT_TRANSACTION_RETRY_LIMIT,
  transactionRetryBaseDelayMs = DEFAULT_TRANSACTION_RETRY_BASE_DELAY_MS,
  transactionEventLogger = () => {}
}) {
  if (!userId || !key) throw httpError("Question search requires a user and stable search key.", 400, "INVALID_SEARCH_INPUT");
  if (!Number.isInteger(trialLimit) || trialLimit < 0) {
    throw httpError("Question search trial limit is invalid.", 500, "INVALID_TRIAL_LIMIT");
  }

  const prisma = getPrisma();
  if (prisma) {
    const execute = async () => prisma.$transaction(async (tx) => {
      const lockedUsers = await tx.$queryRawUnsafe(
        'SELECT "id" FROM "User" WHERE "id" = $1 AND "deletedAt" IS NULL FOR UPDATE',
        userId
      );
      if (!Array.isArray(lockedUsers) || lockedUsers.length !== 1) {
        throw httpError("Question search user not found.", 404, "SEARCH_USER_NOT_FOUND");
      }

      const purchased = await hasPaidEntitlement(userId, { client: tx });
      const existing = await tx.questionSearch.findUnique({
        where: { userId_searchKey: { userId, searchKey: key } }
      });
      const usedBefore = await tx.questionSearch.count({
        where: { userId, source: TRIAL_SEARCH_SOURCE }
      });

      if (existing) {
        return {
          search: toSearch(existing, false),
          purchased,
          trialConsumed: false,
          used: Math.min(trialLimit, usedBefore),
          remaining: purchased ? null : Math.max(0, trialLimit - usedBefore),
          transactionRetryCount: 0
        };
      }
      if (!purchased && usedBefore >= trialLimit) {
        throw httpError(
          "Your two free Question Finder searches are complete. Additional access is not currently available.",
          402,
          "TRIAL_QUOTA_EXHAUSTED"
        );
      }

      const created = await tx.questionSearch.create({
        data: {
          userId,
          searchKey: key,
          query,
          filters: { syllabusIds },
          questionIds,
          resultCount,
          source: purchased ? PAID_SEARCH_SOURCE : TRIAL_SEARCH_SOURCE
        }
      });
      const usedAfter = usedBefore + 1;
      return {
        search: toSearch(created, true),
        purchased,
        trialConsumed: !purchased,
        used: Math.min(trialLimit, usedAfter),
        remaining: purchased ? null : Math.max(0, trialLimit - usedAfter),
        transactionRetryCount: 0
      };
    }, {
      isolationLevel: "ReadCommitted",
      maxWait: 5000,
      timeout: 10000
    });

    try {
      const execution = await executeQuestionSearchTransaction(execute, {
        retryLimit: transactionRetryLimit,
        baseDelayMs: transactionRetryBaseDelayMs,
        eventLogger: transactionEventLogger
      });
      const result = execution.value;
      result.transactionRetryCount = execution.retryCount;
      result.transactionMetrics = execution.metrics;
      return result;
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      transactionEventLogger({ event: "P2002_IDEMPOTENT_RECOVERY" });
      const existing = await prisma.questionSearch.findUnique({
        where: { userId_searchKey: { userId, searchKey: key } }
      });
      if (!existing) throw error;
      const [purchased, used] = await Promise.all([
        hasPaidEntitlement(userId, { client: prisma }),
        prisma.questionSearch.count({
          where: { userId, source: TRIAL_SEARCH_SOURCE }
        })
      ]);
      return {
        search: toSearch(existing, false),
        purchased,
        trialConsumed: false,
        used: Math.min(trialLimit, used),
        remaining: purchased ? null : Math.max(0, trialLimit - used),
        transactionRetryCount: error.transactionMetrics?.p2034Count || 0,
        recoveredFromUniqueConflict: true,
        transactionMetrics: {
          configuredRetryLimit: transactionRetryLimit,
          p2002Count: 1,
          p2034Count: error.transactionMetrics?.p2034Count || 0,
          exhaustedRetryCount: 0,
          retryDelaysMs: error.transactionMetrics?.retryDelaysMs || []
        }
      };
    }
  }

  const db = readUsersDb();
  const user = db.users.find((candidate) => candidate.id === userId);
  if (!user) throw httpError("Question search user not found.", 404, "SEARCH_USER_NOT_FOUND");
  const searches = Array.isArray(user.questionFinderSearches) ? user.questionFinderSearches : [];
  const trialSearches = searches.filter((candidate) =>
    candidate.source === TRIAL_SEARCH_SOURCE
  );
  const existing = searches.find((candidate) => candidate.key === key);
  const purchased = await hasPaidEntitlement(userId);
  if (existing) {
    return {
      search: { ...existing, createdNew: false },
      purchased,
      trialConsumed: false,
      used: Math.min(trialLimit, trialSearches.length),
      remaining: purchased ? null : Math.max(0, trialLimit - trialSearches.length),
      transactionRetryCount: 0,
      transactionMetrics: {
        configuredRetryLimit: transactionRetryLimit,
        p2002Count: 0,
        p2034Count: 0,
        exhaustedRetryCount: 0,
        retryDelaysMs: []
      }
    };
  }
  if (!purchased && trialSearches.length >= trialLimit) {
    throw httpError(
      "Your two free Question Finder searches are complete. Additional access is not currently available.",
      402,
      "TRIAL_QUOTA_EXHAUSTED"
    );
  }
  const search = {
    id: crypto.randomUUID(),
    userId,
    key,
    query,
    syllabusIds,
    questionIds,
    source: purchased ? PAID_SEARCH_SOURCE : TRIAL_SEARCH_SOURCE,
    createdAt: new Date().toISOString()
  };
  searches.push(search);
  user.questionFinderSearches = searches;
  user.updatedAt = new Date().toISOString();
  writeUsersDb(db);
  return {
    search: { ...search, createdNew: true },
    purchased,
    trialConsumed: !purchased,
    used: Math.min(trialLimit, trialSearches.length + (purchased ? 0 : 1)),
    remaining: purchased
      ? null
      : Math.max(0, trialLimit - trialSearches.length - 1),
    transactionRetryCount: 0,
    transactionMetrics: {
      configuredRetryLimit: transactionRetryLimit,
      p2002Count: 0,
      p2034Count: 0,
      exhaustedRetryCount: 0,
      retryDelaysMs: []
    }
  };
}

module.exports = {
  listQuestionSearches,
  findQuestionSearchByKey,
  recordQuestionSearchWithQuota,
  executeQuestionSearchTransaction,
  isTransactionConflict,
  withTransactionRetry,
  DEFAULT_TRANSACTION_RETRY_LIMIT,
  PAID_SEARCH_SOURCE,
  TRIAL_SEARCH_SOURCE
};
