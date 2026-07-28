const crypto = require("node:crypto");
const { getPrisma } = require("./db");
const { readUsersDb, writeUsersDb } = require("./localStore");

async function listQuestionSearches(userId) {
  const prisma = getPrisma();
  if (prisma) {
    const searches = await prisma.questionSearch.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" }
    });
    return searches.map((search) => ({
      id: search.id,
      key: search.searchKey,
      query: search.query,
      syllabusIds: Array.isArray(search.filters?.syllabusIds) ? search.filters.syllabusIds : [],
      questionIds: Array.isArray(search.questionIds) ? search.questionIds : [],
      createdAt: search.createdAt.toISOString()
    }));
  }

  const db = readUsersDb();
  const user = db.users.find((candidate) => candidate.id === userId);
  return Array.isArray(user?.questionFinderSearches) ? user.questionFinderSearches : [];
}

async function findQuestionSearchByKey(userId, key) {
  const searches = await listQuestionSearches(userId);
  return searches.find((search) => search.key === key) || null;
}

async function createQuestionSearch({ userId, key, query, syllabusIds, questionIds, resultCount, source = "question-finder" }) {
  const prisma = getPrisma();
  if (prisma) {
    const search = await prisma.questionSearch.create({
      data: {
        userId,
        searchKey: key,
        query,
        filters: { syllabusIds },
        questionIds,
        resultCount,
        source
      }
    });
    return {
      id: search.id,
      key: search.searchKey,
      query: search.query,
      syllabusIds,
      questionIds,
      createdAt: search.createdAt.toISOString()
    };
  }

  const db = readUsersDb();
  const user = db.users.find((candidate) => candidate.id === userId);
  if (!user) return null;
  const searches = Array.isArray(user.questionFinderSearches) ? user.questionFinderSearches : [];
  const search = {
    id: crypto.randomUUID(),
    key,
    query,
    syllabusIds,
    questionIds,
    createdAt: new Date().toISOString()
  };
  searches.push(search);
  user.questionFinderSearches = searches;
  user.updatedAt = new Date().toISOString();
  writeUsersDb(db);
  return search;
}

module.exports = {
  listQuestionSearches,
  findQuestionSearchByKey,
  createQuestionSearch
};
