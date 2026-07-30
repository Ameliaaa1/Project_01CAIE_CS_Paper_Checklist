const { getPrisma } = require("./db");
const { hasPaidEntitlement } = require("./purchases");
const {
  listQuestionSearches,
  TRIAL_SEARCH_SOURCE
} = require("./questionSearches");

async function getQuestionFinderAccessState(userId, options = {}) {
  const id = String(userId || "").trim();
  const trialLimit = Number.isInteger(options.trialLimit)
    ? options.trialLimit
    : 2;
  if (!id) {
    return {
      hasPaidEntitlement: false,
      trialUsed: 0,
      trialRemaining: 0,
      canSearch: false
    };
  }

  const prisma = options.client || getPrisma();
  let trialUsed;
  if (prisma) {
    [trialUsed] = await Promise.all([
      prisma.questionSearch.count({
        where: { userId: id, source: TRIAL_SEARCH_SOURCE }
      })
    ]);
  } else {
    const searches = await listQuestionSearches(id);
    trialUsed = searches.filter(
      (search) => search.source === TRIAL_SEARCH_SOURCE
    ).length;
  }
  const paid = await hasPaidEntitlement(id, { client: prisma });
  return {
    hasPaidEntitlement: paid,
    trialUsed,
    trialRemaining: Math.max(0, trialLimit - trialUsed),
    canSearch: paid || trialUsed < trialLimit
  };
}

module.exports = {
  getQuestionFinderAccessState
};
