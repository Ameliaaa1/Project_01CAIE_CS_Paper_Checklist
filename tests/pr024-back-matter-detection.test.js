const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  buildStagingRun,
  extractPdfGeometry,
  isBackMatterText,
  parsePaperPath,
  sha256File,
  sliceQuestionPaper,
  stablePaperGroupId
} = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const paperRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper");
const fixturePath = path.join(paperRoot, "caie-igcse-0478", "2021-March", "0478_m21_qp_12.pdf");

(async () => {
  if (!fs.existsSync(fixturePath)) {
    console.warn("Skipping PR-024 back matter detection test because sample PDF is not present.");
    return;
  }

  assert.equal(isBackMatterText("www.cambridgeinternational.org"), false);
  assert.equal(isBackMatterText("Permission to reproduce items where third-party owned material is included"), true);

  const geometry = await extractPdfGeometry(fixturePath);
  assert.equal(geometry.pageCount, 16);
  const lastPage = geometry.pages.at(-1);
  assert.equal(lastPage.pageNumber, 16);
  assert.equal(lastPage.pageType, "back_matter");
  assert.equal(lastPage.containsBackMatter, true);
  assert.equal(lastPage.normalizedText, "BLANK PAGE");
  assert(!/Permission to reproduce|Cambridge Assessment|cambridgeinternational\.org/i.test(lastPage.normalizedText));

  const questions = sliceQuestionPaper(geometry, { paperId: "0478_m21_12" });
  assert.equal(questions.length, 8);
  assert.equal(questions.flatMap((question) => question.leafQuestions || []).length, 29);
  assert.equal(questions.reduce((sum, question) => sum + Number(question.marks || 0), 0), 75);
  assert.deepEqual(questions.map((question) => question.questionNumber), ["1", "2", "3", "4", "5", "6", "7", "8"]);

  const q2 = questions.find((question) => question.questionNumber === "2");
  assert(q2.text.includes("www.cambridgeinternational.org"));
  assert(!q2.issues.some((issue) => issue.code === "BACK_MATTER_INCLUDED"));

  const staging = await stagingForFixture(geometry, questions);
  assert(!staging.issues.some((issue) => issue.code === "BACK_MATTER_INCLUDED"));
  assert.equal(staging.run.summary_json.validationStatus, "PASS");
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
