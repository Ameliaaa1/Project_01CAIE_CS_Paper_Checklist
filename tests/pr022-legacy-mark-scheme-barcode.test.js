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
const fixtures = [
  ["caie-igcse-0478/2019-March/0478_m19_ms_22.pdf", 12],
  ["caie-igcse-0478/2019-May-June/0478_s19_ms_21.pdf", 16],
  ["caie-igcse-0478/2019-May-June/0478_s19_ms_22.pdf", 12],
  ["caie-igcse-0478/2019-May-June/0478_s19_ms_23.pdf", 12],
  ["caie-igcse-0478/2019-Oct-Nov/0478_w19_ms_21.pdf", 14],
  ["caie-igcse-0478/2019-Oct-Nov/0478_w19_ms_22.pdf", 14],
  ["caie-igcse-0478/2019-Oct-Nov/0478_w19_ms_23.pdf", 15]
];

(async () => {
  const existingFixtures = fixtures
    .map(([relativePath, expectedEntries]) => [path.join(paperRoot, relativePath), expectedEntries])
    .filter(([fixturePath]) => fs.existsSync(fixturePath));
  if (!existingFixtures.length) {
    console.warn("Skipping PR-022 legacy Mark Scheme barcode test because sample PDFs are not present.");
    return;
  }

  for (const [fixturePath, expectedEntries] of existingFixtures) {
    const geometry = await extractPdfGeometry(fixturePath);
    const legacyControlGlyphs = geometry.pages.flatMap((page) =>
      page.items
        .filter((item) => /^[\u0000-\u001f\u007f-\u009f]+$/.test(item.text || "") && /Wingdings|Symbol|ZapfDingbats/i.test(item.font || ""))
        .map((item) => ({ pageNumber: page.pageNumber, ...item }))
    );
    assert(legacyControlGlyphs.length > 0, `${path.basename(fixturePath)} should expose legacy control glyphs.`);
    assert(
      legacyControlGlyphs.every((item) => item.regionType === "barcode"),
      `${path.basename(fixturePath)} legacy control glyphs should be classified before canonical text admission.`
    );
    geometry.pages.forEach((page) => {
      assert.doesNotMatch(page.normalizedText, /[\u0000-\u001f\u007f-\u009f]/);
      assert.doesNotMatch(page.displayText, /[\u0000-\u001f\u007f-\u009f]/);
    });

    const staging = await stagingForMarkScheme(fixturePath, geometry);
    assert.equal(staging.questions.length, 0);
    assert.equal(staging.mark_scheme_entries.length, expectedEntries);
    assert(!staging.issues.some((issue) => issue.code === "BARCODE_TEXT_PRESENT"));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function stagingForMarkScheme(fixturePath, geometry) {
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
