const assert = require("node:assert/strict");
const http = require("node:http");

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

async function postJson(baseUrl, pathname, body, token) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": `paperlens_session=${token}`,
      "Origin": baseUrl
    },
    body: JSON.stringify(body)
  });
  return {
    status: response.status,
    data: await response.json()
  };
}

async function runPaidToRefundedAccessStateTest(options) {
  const {
    handleRequest,
    prisma,
    userStore,
    sessionStore,
    purchaseStore,
    questionSearchStore
  } = options;
  const created = await userStore.createUser({
    email: `db-a4-r2-${Date.now()}@example.invalid`,
    firstName: "Synthetic",
    lastName: "RefundAccess",
    password: "SyntheticPass123!"
  });
  const userId = created.user.id;
  const request = {
    headers: {
      "user-agent": "DB-A4-R2-Synthetic-API-Test",
      "x-forwarded-for": "127.0.0.1"
    },
    socket: { remoteAddress: "127.0.0.1" }
  };
  const token = await sessionStore.createSession(userId, request, 3600);
  await questionSearchStore.recordQuestionSearchWithQuota({
    userId,
    key: "r2-initial-trial",
    query: "initial trial",
    syllabusIds: ["caie-igcse-0478"],
    questionIds: ["R2-SYNTHETIC-INITIAL"],
    resultCount: 1,
    trialLimit: 2
  });
  const syntheticPurchase = await purchaseStore.createSyntheticPurchase({
    id: `r2-paid-${Date.now()}`,
    userId
  });
  for (let index = 0; index < 10; index += 1) {
    await questionSearchStore.recordQuestionSearchWithQuota({
      userId,
      key: `r2-paid-${index}`,
      query: `paid search ${index}`,
      syllabusIds: ["caie-igcse-0478"],
      questionIds: [`R2-SYNTHETIC-PAID-${index}`],
      resultCount: 1,
      trialLimit: 2
    });
  }
  await prisma.purchase.update({
    where: { id: syntheticPurchase.purchase.id },
    data: { status: "REFUNDED" }
  });

  const server = http.createServer(handleRequest);
  const port = await listen(server);
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    const accessAfterRefund = await postJson(
      baseUrl,
      "/api/question-finder/access",
      {},
      token
    );
    assert.equal(accessAfterRefund.status, 200);
    assert.equal(accessAfterRefund.data.hasPaidEntitlement, false);
    assert.equal(accessAfterRefund.data.trialUsed, 1);
    assert.equal(accessAfterRefund.data.trialRemaining, 1);
    assert.equal(accessAfterRefund.data.canSearch, true);

    const secondTrial = await postJson(
      baseUrl,
      "/api/question-search",
      {
        query: "database",
        syllabusIds: ["caie-igcse-0478"]
      },
      token
    );
    assert.equal(secondTrial.status, 200);
    assert.equal(secondTrial.data.trialConsumed, true);
    assert.equal(secondTrial.data.access.trialUsed, 2);
    assert.equal(secondTrial.data.access.trialRemaining, 0);

    const sourceCounts = await prisma.questionSearch.groupBy({
      by: ["source"],
      where: { userId },
      _count: { _all: true }
    });
    const count = (source) =>
      sourceCounts.find((row) => row.source === source)?._count._all || 0;
    const trialSearchCount = count(questionSearchStore.TRIAL_SEARCH_SOURCE);
    const paidSearchCount = count(questionSearchStore.PAID_SEARCH_SOURCE);
    assert.equal(trialSearchCount, 2);
    assert.equal(paidSearchCount, 10);
    return {
      userId,
      accessAfterRefund: accessAfterRefund.data,
      secondTrial: {
        status: secondTrial.status,
        trialConsumed: secondTrial.data.trialConsumed,
        access: secondTrial.data.access
      },
      trialSearchCount,
      paidSearchCount,
      status: "PASS"
    };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

module.exports = {
  runPaidToRefundedAccessStateTest
};
