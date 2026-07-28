const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  applyDocumentProfile,
  buildStagingRun,
  extractPdfGeometry,
  parsePaperPath,
  publicPageSummary,
  sha256File,
  stablePaperGroupId
} = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const paperRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper");
const fixturePath = path.join(paperRoot, "caie-igcse-0478", "2023-Oct-Nov", "0478_w23_ms_23.pdf");

(async () => {
  if (!fs.existsSync(fixturePath)) {
    console.warn("Skipping PR-021 barcode region classification test because the sample PDF is not present.");
    return;
  }

  const geometry = await extractPdfGeometry(fixturePath);
  const footerUclesItems = geometry.pages.flatMap((page) =>
    page.items
      .filter((item) => item.text === "UCLES" && item.bboxTopLeft?.[1] > page.height * 0.8)
      .map((item) => ({ pageNumber: page.pageNumber, ...item }))
  );

  assert(footerUclesItems.length > 0, "Fixture should expose footer UCLES tokens for the edge case.");
  assert(
    footerUclesItems.every((item) => item.regionType === "footer"),
    "Footer UCLES tokens must be classified before canonical text admission."
  );

  geometry.pages.forEach((page) => {
    assert.doesNotMatch(page.normalizedText, /\bUCLES\b|\bTurn over\b|[\u0000-\u001f\u007f-\u009f]/i);
    assert.doesNotMatch(page.displayText, /\bUCLES\b|\bTurn over\b|[\u0000-\u001f\u007f-\u009f]/i);
    assert.equal(page.textQuality.normalizedSuspiciousGlyphCount, 0);
    assert.equal(page.textQuality.displaySuspiciousGlyphCount, 0);
  });

  const staging = await stagingForMarkScheme(geometry);
  assert(!staging.issues.some((issue) => issue.code === "BARCODE_TEXT_PRESENT"));
  assert.equal(staging.validation.status, "PASS");
  assert.equal(staging.run.publish_status, "BLOCKED");
  assert(staging.run.summary_json.publishGate.blockedReasons.includes("CANONICAL_COMPLETENESS_GATE_PASS"));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function stagingForMarkScheme(geometry) {
  const paper = parsePaperPath(fixturePath, paperRoot);
  const stableGroupId = stablePaperGroupId(paper.paperGroupId);
  const parserOutput = applyDocumentProfile({
    sourceFile: path.relative(rootDir, fixturePath),
    paper: {
      ...paper,
      id: `${stableGroupId}-${paper.role}`,
      paperGroupId: stableGroupId,
      documentRole: "mark_scheme",
      storageKey: path.posix.join("pastpaper", paper.relativePath.split(path.sep).join("/")),
      schemaVersion: "1.0.0",
      parserVersion: "0.4.0",
      fileHash: await sha256File(fixturePath)
    },
    pages: geometry.pages,
    questions: []
  });
  parserOutput.pages = parserOutput.pages.map((page) => ({
    ...publicPageSummary(page),
    pageImagePath: path.posix.join("rendered", `${stableGroupId}-${paper.role}`, `page-${String(page.pageNumber).padStart(3, "0")}.webp`)
  }));
  seedGeneratedAssets(parserOutput.pages);
  return buildStagingRun(parserOutput, { assetRoot: rootDir, adminApproved: true, humanApproved: true });
}

function seedGeneratedAssets(pages) {
  pages.map((page) => page.pageImagePath).filter(Boolean).forEach((relativePath) => {
    const filePath = path.join(rootDir, "output", "ingestion-samples", relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, Buffer.from("test-webp-placeholder"));
  });
}
