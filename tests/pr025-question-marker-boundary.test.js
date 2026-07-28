const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  buildStagingRun,
  extractPdfGeometry,
  parsePaperPath,
  questionMarkerDiagnostics,
  sha256File,
  sliceQuestionPaper,
  stablePaperGroupId
} = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const paperRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper");
const fixturePath = path.join(paperRoot, "caie-igcse-0478", "2020-May-June ", "0478_s20_qp_22.pdf");

(async () => {
  if (!fs.existsSync(fixturePath)) {
    console.warn("Skipping PR-025 question marker boundary test because sample PDF is not present.");
    return;
  }

  const geometry = await extractPdfGeometry(fixturePath);
  const diagnostics = questionMarkerDiagnostics(geometry.pages, { maxQuestions: 30 });
  const rejectedQ18Line = diagnostics.find((entry) =>
    entry.token === "18" &&
    entry.pageNumber === 8 &&
    /OUTPUT "There are/.test(entry.sourceLine)
  );
  assert(rejectedQ18Line, "Expected pseudocode line 18 diagnostic.");
  assert.equal(rejectedQ18Line.decision, "rejected");
  assert.equal(rejectedQ18Line.reason, "pseudocode_or_numeric_content_line");

  const acceptedQ6 = diagnostics.find((entry) => entry.token === "6" && entry.pageNumber === 13);
  assert(acceptedQ6, "Expected real question 6 marker diagnostic.");
  assert.equal(acceptedQ6.decision, "accepted");

  const questions = sliceQuestionPaper(geometry, { paperId: "0478_s20_22" });
  assert.deepEqual(questions.map((question) => question.questionNumber), ["1", "2", "3", "4", "5", "6"]);
  assert(!questions.some((question) => question.id === "0478-S20-22-Q18"));
  const q6 = questions.find((question) => question.questionNumber === "6");
  assert(q6, "Expected question 6 after rejecting pseudocode line numbers.");
  assert.equal(q6.markValidation.valid, true);
  assert.equal(q6.markValidation.declared, 6);
  assert.equal(q6.markValidation.leafSum, 6);

  const staging = await stagingForFixture(fixturePath);
  assert(!staging.questions.some((question) => question.id === "0478-2020-MJ-22-Q18"));
  assert(!staging.issues.some((issue) => issue.code === "MARK_SUM_MISMATCH"));
})();

async function stagingForFixture(filePath) {
  const paper = parsePaperPath(filePath, paperRoot);
  const stableGroupId = stablePaperGroupId(paper.paperGroupId);
  const geometry = await extractPdfGeometry(filePath);
  const questions = sliceQuestionPaper(geometry, { paperId: paper.paperGroupId });
  const parserOutput = {
    sourceFile: path.relative(rootDir, filePath),
    paper: {
      ...paper,
      id: `${stableGroupId}-${paper.role}`,
      paperGroupId: stableGroupId,
      documentRole: "question_paper",
      storageKey: path.posix.join("pastpaper", paper.relativePath.split(path.sep).join("/")),
      schemaVersion: "1.0.0",
      parserVersion: "0.4.0",
      fileHash: await sha256File(filePath)
    },
    pages: geometry.pages.map((page) => ({
      ...page,
      pageImagePath: path.posix.join("rendered", `${stableGroupId}-${paper.role}`, `page-${String(page.pageNumber).padStart(3, "0")}.webp`)
    })),
    questions
  };
  seedGeneratedAssets(parserOutput.pages, questions);
  return buildStagingRun(parserOutput, { assetRoot: rootDir, adminApproved: true, humanApproved: true });
}

function seedGeneratedAssets(pages, questions) {
  const leaves = questions.flatMap((question) => question.leafQuestions || []);
  const files = [
    ...leaves.filter((leaf) => leaf.questionImagePath).map((leaf) => leaf.questionImagePath),
    ...pages.map((page) => page.pageImagePath)
  ].filter(Boolean);
  files.forEach((relativePath) => {
    const filePath = path.join(rootDir, "output", "ingestion-samples", relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, Buffer.from("test-webp-placeholder"));
  });
}
