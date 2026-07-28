const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  buildStagingRun,
  evaluateCanonicalCompleteness,
  extractPdfGeometry,
  parsePaperPath,
  sha256File,
  sliceQuestionPaper,
  stablePaperGroupId
} = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const paperRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper");
const fixturePath = path.join(paperRoot, "caie-igcse-0478", "2023-May-June", "0478_s23_qp_22.pdf");

(async () => {
  const geometry = await extractPdfGeometry(fixturePath);
  const questions = sliceQuestionPaper(geometry, { paperId: "0478-2023-MJ-22" });
  const q7 = questions.find((question) => question.questionNumber === "7");
  const q8 = questions.find((question) => question.questionNumber === "8");

  assert.equal(questions.length, 12);
  assert.equal(questions.reduce((sum, question) => sum + question.marks, 0), 75);
  assert.equal(q7.id, "0478-2023-MJ-22-Q7");
  assert.equal(q7.marks, 10);
  assert.deepEqual(q7.markValidation, { declared: 10, leafSum: 10, valid: true });
  assert.deepEqual(q7.leafQuestions.map((leaf) => [leaf.id, leaf.marks]), [
    ["0478-2023-MJ-22-Q7-A", 3],
    ["0478-2023-MJ-22-Q7-B", 3],
    ["0478-2023-MJ-22-Q7-C", 4]
  ]);
  assert.match(q7.text, /Number\s*\[5\]/);
  assert(!q7.issues.some((issue) => issue.code === "MARK_SUM_MISMATCH"));
  assert.equal(q8.id, "0478-2023-MJ-22-Q8");
  assert.equal(q8.marks, 4);
  assert(questions.every((question) => question.markValidation.valid));

  const staging = await stagingForFixture(geometry, questions);
  assert.equal(staging.validation.status, "PASS");
  assert(!staging.validation.issues.some((issue) => issue.code === "MARK_SUM_MISMATCH"));
  assert.equal(evaluateCanonicalCompleteness(staging).status, "PASS");
})();

async function stagingForFixture(geometry, questions) {
  const paper = parsePaperPath(fixturePath, paperRoot);
  const stableGroupId = stablePaperGroupId(paper.paperGroupId);
  const parserOutput = {
    sourceFile: path.relative(rootDir, fixturePath),
    paper: {
      ...paper,
      id: `${stableGroupId}-${paper.role}`,
      paperGroupId: stableGroupId,
      documentRole: "question_paper",
      storageKey: path.posix.join("pastpaper", paper.relativePath.split(path.sep).join("/")),
      schemaVersion: "1.0.0",
      parserVersion: "0.4.0",
      fileHash: await sha256File(fixturePath)
    },
    pages: geometry.pages.map((page) => ({
      ...page,
      pageImagePath: path.posix.join("rendered", `${stableGroupId}-${paper.role}`, `page-${String(page.pageNumber).padStart(3, "0")}.webp`)
    })),
    questions
  };
  seedGeneratedAssets(parserOutput.pages, questions);
  return buildStagingRun(parserOutput, { assetRoot: rootDir, adminApproved: true });
}

function seedGeneratedAssets(pages, questions) {
  const files = [
    ...questions.flatMap((question) => question.leafQuestions || []).map((leaf) => leaf.questionImagePath),
    ...pages.map((page) => page.pageImagePath)
  ].filter(Boolean);
  files.forEach((relativePath) => {
    const filePath = path.join(rootDir, "output", "ingestion-samples", relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, Buffer.from("test-webp-placeholder"));
  });
}
