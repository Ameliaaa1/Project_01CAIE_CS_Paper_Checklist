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
  stablePaperGroupId,
  suspiciousCharacterCount
} = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const paperRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper");
const fixturePath = path.join(
  paperRoot,
  "caie-igcse-0478",
  "2023-May-June",
  "0478_s23_qp_21.pdf"
);

(async () => {
  const geometry = await extractPdfGeometry(fixturePath);
  const page2 = geometry.pages.find((page) => page.pageNumber === 2);
  const legacyCheckmark = page2.items.find((item) => item.font === "Wingdings-Regular" && item.text === "✓");

  assert(legacyCheckmark, "The legacy Wingdings checkmark should remain as a valid canonical symbol.");
  assert.equal(legacyCheckmark.size, 13);
  assert.deepEqual(legacyCheckmark.bboxTopLeft.map((value) => Number(value.toFixed(2))), [99.1, 633.26, 109.32, 647.69]);
  assert.match(page2.displayText, /✓/);
  assert.doesNotMatch(page2.displayText, /ü/);
  assert.equal(page2.textQuality.rawSuspiciousGlyphCount, 0);
  assert.equal(page2.textQuality.normalizedSuspiciousGlyphCount, 0);
  assert.equal(page2.textQuality.displaySuspiciousGlyphCount, 0);
  assert.equal(suspiciousCharacterCount(page2.displayText), 0);

  const staging = await stagingForFixture(geometry);
  assert.equal(staging.validation.status, "PASS");
  assert(!staging.validation.issues.some((issue) => issue.code === "SUSPICIOUS_GLYPHS_REMAIN"));
  assert.equal(evaluateCanonicalCompleteness(staging).status, "PASS");
})();

async function stagingForFixture(geometry) {
  const paper = parsePaperPath(fixturePath, paperRoot);
  const stableGroupId = stablePaperGroupId(paper.paperGroupId);
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
