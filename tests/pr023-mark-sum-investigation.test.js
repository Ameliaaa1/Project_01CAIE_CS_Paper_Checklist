const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  buildStagingRun,
  extractPdfGeometry,
  parsePaperPath,
  sha256File,
  sliceQuestionPaper,
  stablePaperGroupId
} = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const paperRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper");
const fixtures = {
  arrayIndex0478: path.join(paperRoot, "caie-igcse-0478", "2019-Oct-Nov", "0478_w19_qp_23.pdf"),
  falseMarker0478: path.join(paperRoot, "caie-igcse-0478", "2020-May-June ", "0478_s20_qp_22.pdf"),
  arrayIndex9618: path.join(paperRoot, "caie-as-a-level-9618", "2021 Oct Nov", "9618_w21_qp_41.pdf")
};

(async () => {
  if (!Object.values(fixtures).every((fixture) => fs.existsSync(fixture))) {
    console.warn("Skipping PR-023 mark sum investigation test because sample PDFs are not present.");
    return;
  }

  const w19 = await stagingForFixture(fixtures.arrayIndex0478);
  const w19Q5 = questionByNumber(w19, "5");
  assert.equal(w19Q5.raw_json.markValidation.valid, true);
  assert.equal(w19Q5.marks, 8);
  assert(!w19.issues.some((issue) => issue.code === "MARK_SUM_MISMATCH"));

  const w21 = await stagingForFixture(fixtures.arrayIndex9618);
  const w21Q3 = questionByNumber(w21, "3");
  assert.equal(w21Q3.raw_json.markValidation.valid, true);
  assert.equal(w21Q3.marks, 28);
  assert(!w21.issues.some((issue) => issue.code === "MARK_SUM_MISMATCH"));

  const s20 = await stagingForFixture(fixtures.falseMarker0478);
  assert(!s20.questions.some((question) => question.id === "0478-2020-MJ-22-Q18"));
  assert(!s20.issues.some((issue) => issue.code === "MARK_SUM_MISMATCH"));
})();

async function stagingForFixture(fixturePath) {
  const paper = parsePaperPath(fixturePath, paperRoot);
  const stableGroupId = stablePaperGroupId(paper.paperGroupId);
  const geometry = await extractPdfGeometry(fixturePath);
  const questions = sliceQuestionPaper(geometry, { paperId: paper.paperGroupId });
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
  return buildStagingRun(parserOutput, { assetRoot: rootDir, adminApproved: true, humanApproved: true });
}

function questionByNumber(staging, questionNumber) {
  const question = staging.questions.find((candidate) => !candidate.is_leaf && candidate.question_number === questionNumber);
  assert(question, `Missing parent question ${questionNumber}`);
  return question;
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
