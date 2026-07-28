const assert = require("node:assert/strict");
const path = require("node:path");
const { loadProductionQuestionEntries, readProductionStore } = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const storePath = path.join(rootDir, "output", "production", "production-store.json");
const store = readProductionStore(storePath);
const components = ["11", "12", "13", "21", "22", "23"];

assert(store.papers.length >= 258);
assert(store.pairings.length >= 129);
assert(store.questions.filter((question) => !question.isLeaf || (question.depth === 0 && !question.parentQuestionId)).length >= 980);
assert(store.questions.filter((question) => question.isLeaf).length >= 3189);
assert(store.responseAreas.length >= 14186);
assert(store.markSchemeEntries.length >= 2998);
assert(store.expansionBatches.some((batch) => batch.id === "PR028-0478-2023-MJ"));

components.forEach((component) => {
  const qpId = `0478-2023-MJ-${component}-QP`;
  const msId = `0478-2023-MJ-${component}-MS`;
  const qp = store.papers.find((paper) => paper.id === qpId);
  const ms = store.papers.find((paper) => paper.id === msId);
  const pairing = store.pairings.find((candidate) => candidate.questionPaperId === qpId && candidate.markSchemeId === msId);
  const questions = store.questions.filter((question) => question.paperId === qpId);
  const roots = questions.filter((question) => !question.isLeaf || (question.depth === 0 && !question.parentQuestionId));
  const leaves = questions.filter((question) => question.isLeaf);

  assert(qp && ms && pairing, `Component ${component} must preserve its QP/MS linkage.`);
  assert(qp.fileHash && ms.fileHash);
  assert(qp.sourceTrace.length > 0 && ms.sourceTrace.length > 0);
  assert(roots.length > 0 && leaves.length > 0);
  assert(questions.every((question) => question.id && Number.isInteger(question.marks)));
  assert(leaves.every((leaf) => !leaf.parentQuestionId || questions.some((question) => question.id === leaf.parentQuestionId)));
});

const searchEntries = loadProductionQuestionEntries(storePath);
assert(searchEntries.length >= 980);
assert(searchEntries.every((entry) => entry.production && entry.canonicalQuestionId && entry.question));
assert(searchEntries.some((entry) => entry.answer.startsWith("MS:") && entry.canonicalQuestionId.startsWith("0478-2023-MJ-21-")));
