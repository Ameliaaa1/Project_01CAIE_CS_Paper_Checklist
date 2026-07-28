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
const fixturePath = path.join(paperRoot, "caie-igcse-0478", "2023-May-June", "0478_s23_qp_11.pdf");

(async () => {
  if (!fs.existsSync(fixturePath)) {
    console.warn("Skipping PR-030 response-area test because fixture is not present.");
    return;
  }
  const geometry = await extractPdfGeometry(fixturePath);
  const questions = sliceQuestionPaper(geometry, { paperId: "0478_s23_11" });
  assert.equal(questions.length, 10);
  const leaves = questions.flatMap((question) => question.leafQuestions || []);
  assert.equal(leaves.length, 32);
  const q3b = leaves.find((leaf) => leaf.id === "0478-S23-11-Q3-B");
  assert(q3b, "Expected Q3(b) leaf.");
  assert.equal(q3b.marks, 1);
  assert.equal(q3b.responseAreaStatus, "PRESENT");
  assert.equal(q3b.responseAreas.length, 1);
  assert.equal(q3b.responseAreas[0].type, "choice_area");
  assert.equal(q3b.responseAreas[0].source.detection, "layout_keyword");
  assert(!q3b.issues.some((issue) => issue.code === "MISSING_RESPONSE_AREAS"));

  const required = leaves.filter((leaf) => Number(leaf.marks || 0) > 0);
  const present = required.filter((leaf) => leaf.responseAreaStatus === "PRESENT" && leaf.responseAreas.length > 0);
  assert.equal(required.length, 32);
  assert.equal(present.length, 32);
  leaves.forEach((leaf) => assert.equal(new Set(leaf.responseAreas.map((area) => area.id)).size, leaf.responseAreas.length));

  const staging = await stagingForFixture(geometry, questions);
  assert.equal(staging.validation.status, "PASS");
  assert(!staging.issues.some((issue) => issue.code === "RESPONSE_AREA_MAPPING_INCOMPLETE"));
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
