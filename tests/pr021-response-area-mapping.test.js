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
const fixtures = [
  path.join(paperRoot, "caie-igcse-0478", "2023-May-June", "0478_s23_qp_12.pdf"),
  path.join(paperRoot, "caie-igcse-0478", "2025-May-June", "0478_s25_qp_12.pdf"),
  path.join(paperRoot, "caie-igcse-0478", "2025-Oct-Nov", "0478_w25_qp_11.pdf")
];

(async () => {
  const existingFixtures = fixtures.filter((fixture) => fs.existsSync(fixture));
  if (!existingFixtures.length) {
    console.warn("Skipping PR-021 response-area mapping test because sample PDFs are not present.");
    return;
  }

  for (const fixturePath of existingFixtures) {
    const staging = await stagingForFixture(fixturePath);
    const duplicateIds = duplicateQuestionIds(staging.questions);
    const issueCodes = new Set(staging.issues.map((issue) => issue.code));
    const requiredLeaves = staging.questions.filter((question) => question.is_leaf && Number(question.marks || 0) > 0);

    assert.equal(staging.run.p0_issue_count, 0, `${path.basename(fixturePath)} should not emit P0 staging issues`);
    assert.deepEqual(duplicateIds, [], `${path.basename(fixturePath)} should not produce duplicate staging question IDs`);
    assert(!issueCodes.has("DUPLICATE_ID"), `${path.basename(fixturePath)} should not emit DUPLICATE_ID`);
    assert(!issueCodes.has("RESPONSE_AREA_MAPPING_INCOMPLETE"), `${path.basename(fixturePath)} should not emit RESPONSE_AREA_MAPPING_INCOMPLETE`);
    assert(requiredLeaves.length > 0, `${path.basename(fixturePath)} should expose required leaf questions`);
    assert(
      requiredLeaves.every((question) => question.response_area_status === "PRESENT" && question.response_areas_json.length > 0),
      `${path.basename(fixturePath)} should map every required leaf to at least one response area`
    );

    const diagnostics = staging.run.summary_json.questionAggregationDiagnostics || [];
    diagnostics.forEach((diagnostic) => {
      assert.equal(typeof diagnostic.questionId, "string");
      assert(diagnostic.instances >= 2);
      assert(Array.isArray(diagnostic.sources));
    });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

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

function duplicateQuestionIds(questions) {
  const counts = new Map();
  questions.forEach((question) => counts.set(question.id, (counts.get(question.id) || 0) + 1));
  return [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id);
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
