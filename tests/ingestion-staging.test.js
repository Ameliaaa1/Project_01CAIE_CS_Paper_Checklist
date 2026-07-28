const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  assertReadyToPublish,
  applyDocumentProfile,
  buildStagingRun,
  evaluatePublishGate,
  extractPdfGeometry,
  mapParserOutputToStagingRecords,
  parsePaperPath,
  publicPageSummary,
  runCanonicalCompletenessGate,
  sha256File,
  sliceQuestionPaper,
  stablePaperGroupId,
  validateStagingRecords
} = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const paperRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper");
const fixturePath = path.join(paperRoot, "caie-igcse-0478", "2025-May-June", "0478_s25_qp_12.pdf");
const markSchemeFixturePath = path.join(paperRoot, "caie-igcse-0478", "2025-Oct-Nov", "0478_w25_ms_11.pdf");

(async () => {
  if (!fs.existsSync(fixturePath)) {
    console.warn("Skipping ingestion staging test because the sample PDF is not present.");
    return;
  }

  const paper = parsePaperPath(fixturePath, paperRoot);
  const stableGroupId = stablePaperGroupId(paper.paperGroupId);
  const geometry = await extractPdfGeometry(fixturePath);
  const questions = sliceQuestionPaper(geometry, { paperId: paper.paperGroupId });
  seedGeneratedAssets(geometry.pages, questions);
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
  const staging = buildStagingRun(parserOutput, { assetRoot: rootDir, adminApproved: true, humanApproved: true, humanReviewer: "test-admin" });
  attachDiskCompleteness(staging);
  const leaves = questions.flatMap((question) => question.leafQuestions || []);
  const leafByNumber = new Map(leaves.map((leaf) => [leaf.questionNumber, leaf]));

  assert.equal(staging.run.p0_issue_count, 0);
  assert.equal(staging.run.p1_issue_count, 0);
  assert.equal(staging.run.publish_status, "READY_TO_PUBLISH");
  assert.equal(staging.run.summary_json.productionWrite, false);
  assertReadyToPublish(staging);
  assert.equal(staging.questions.filter((question) => question.is_leaf).length, 27);
  assert.equal(staging.questions.filter((question) => question.is_leaf && question.response_area_status !== "PRESENT").length, 0);
  assert.equal(staging.questions.filter((question) => question.is_leaf && question.response_areas_json.length === 0).length, 0);
  assert(staging.review_actions.some((action) => action.approval_type === "AUTOMATED_FIXTURE_VALIDATION"));
  assert(staging.review_actions.some((action) => action.approval_type === "HUMAN_ADMIN_REVIEW"));
  assert.equal(staging.review_actions.find((action) => action.approval_type === "HUMAN_ADMIN_REVIEW").reviewer, "test-admin");

  assert.match(leafByNumber.get("1(e)").displayText, /01100101/);
  assert.match(leafByNumber.get("1(e)").displayText, /01110000/);
  assert.match(leafByNumber.get("3(b)(i)").displayText, /\[BLANK_1\]/);
  assert.equal(leafByNumber.get("3(b)(i)").responseAreas.length, 5);
  assert.equal(staging.questions.find((question) => question.question_number === "3(b)(i)").response_areas_json.length, 5);
  assert.doesNotMatch(leafByNumber.get("5(c)(ii)").displayText, /publisher will be pleased|cambridgeinternational\.org|Cambridge Assessment/i);
  assert.match(leafByNumber.get("1(g)").searchText, /-22/);

  assert.equal(staging.pages.length, 12);
  staging.pages.forEach((page) => {
    assert.match(page.page_image_key, /^staging\/rendered\/0478-2025-MJ-12-QP\/page-\d{3}\.webp$/);
    assert(Array.isArray(page.source_blocks_json));
  });

  assert.equal(staging.assets.length, 15);
  staging.assets.forEach((asset) => {
    assert.equal(asset.status, "generated");
    assert(asset.byte_size > 0);
    assert.match(asset.content_hash, /^[a-f0-9]{64}$/);
  });

  const mapped = mapParserOutputToStagingRecords(parserOutput, { assetRoot: rootDir, adminApproved: true, humanApproved: true });
  const damaged = structuredClone(mapped);
  const blankQuestion = damaged.questions.find((question) => question.question_number === "3(b)(i)");
  blankQuestion.response_areas_json = [];
  blankQuestion.response_area_status = "MISSING";
  const damagedValidation = validateStagingRecords(damaged);
  assert.equal(damagedValidation.status, "FAIL");
  assert(damagedValidation.issues.some((issue) => issue.code === "RESPONSE_AREAS_NOT_STAGED"));
  assert(damagedValidation.issues.some((issue) => issue.code === "RESPONSE_AREA_MAPPING_INCOMPLETE"));

  const metricDamaged = structuredClone(staging);
  metricDamaged.pages[4].text_quality_json.normalizedSuspiciousGlyphCount = 99;
  metricDamaged.validation = validateStagingRecords(metricDamaged);
  metricDamaged.issues = metricDamaged.validation.issues;
  assert(metricDamaged.validation.issues.some((issue) => issue.code === "TEXT_QUALITY_METRIC_INCONSISTENT"));
  assert.equal(evaluatePublishGate(metricDamaged).publishStatus, "BLOCKED");

  const barcodeDamaged = structuredClone(staging);
  barcodeDamaged.pages[4].display_text += " ĬÀċñÐğĄđÑĀĆÝµĒĎ¹ěĂ 0478/12/M/J/25";
  barcodeDamaged.validation = validateStagingRecords(barcodeDamaged);
  barcodeDamaged.issues = barcodeDamaged.validation.issues;
  assert(barcodeDamaged.validation.issues.some((issue) => issue.code === "BARCODE_TEXT_PRESENT"));
  assert.equal(evaluatePublishGate(barcodeDamaged).publishStatus, "BLOCKED");

  const unapproved = buildStagingRun(parserOutput, { assetRoot: rootDir, adminApproved: false });
  const gate = evaluatePublishGate(unapproved);
  assert.equal(gate.publishStatus, "BLOCKED");
  assert(gate.blockedReasons.includes("ADMIN_REVIEW_APPROVED"));

  const automatedOnly = buildStagingRun(parserOutput, { assetRoot: rootDir, adminApproved: true });
  const automatedGate = evaluatePublishGate(automatedOnly);
  assert.equal(automatedGate.publishStatus, "BLOCKED");
  assert(automatedGate.checks.some((check) => check.code === "RESPONSE_AREA_COVERAGE_VALID"));
  assert(automatedOnly.review_actions.some((action) => action.approval_type === "AUTOMATED_FIXTURE_VALIDATION"));
  assert(!automatedOnly.review_actions.some((action) => action.approval_type === "HUMAN_ADMIN_REVIEW"));

  if (fs.existsSync(markSchemeFixturePath)) {
    const markSchemePaper = parsePaperPath(markSchemeFixturePath, paperRoot);
    const markSchemeStableGroupId = stablePaperGroupId(markSchemePaper.paperGroupId);
    const markSchemeGeometry = await extractPdfGeometry(markSchemeFixturePath);
    const markSchemeParserOutput = applyDocumentProfile({
      sourceFile: path.relative(rootDir, markSchemeFixturePath),
      paper: {
        ...markSchemePaper,
        id: `${markSchemeStableGroupId}-${markSchemePaper.role}`,
        paperGroupId: markSchemeStableGroupId,
        documentRole: "mark_scheme",
        storageKey: path.posix.join("pastpaper", markSchemePaper.relativePath.split(path.sep).join("/")),
        schemaVersion: "1.0.0",
        parserVersion: "0.4.0",
        fileHash: await sha256File(markSchemeFixturePath)
      },
      pages: markSchemeGeometry.pages,
      questions: []
    });
    markSchemeParserOutput.pages = markSchemeParserOutput.pages.map((page) => ({
      ...publicPageSummary(page),
      pageImagePath: path.posix.join("rendered", `${markSchemeStableGroupId}-${markSchemePaper.role}`, `page-${String(page.pageNumber).padStart(3, "0")}.webp`)
    }));
    seedGeneratedAssets(markSchemeParserOutput.pages, []);
    const markSchemeStaging = buildStagingRun(markSchemeParserOutput, { assetRoot: rootDir, adminApproved: true, humanApproved: true });
    attachDiskCompleteness(markSchemeStaging);
    const markSchemeGate = evaluatePublishGate(markSchemeStaging);
    const markSchemeRegionTypes = new Set(markSchemeStaging.pages.flatMap((page) => page.content_regions_json.map((region) => region.type)));

    assert.equal(markSchemeStaging.papers[0].document_role, "mark_scheme");
    assert.equal(markSchemeStaging.run.summary_json.documentProfile.validationProfile, "MARK_SCHEME");
    assert.equal(markSchemeStaging.questions.length, 0);
    assert(markSchemeStaging.mark_scheme_entries.length > 0);
    assert(!markSchemeRegionTypes.has("question_content"));
    assert(!markSchemeRegionTypes.has("response_area"));
    assert(markSchemeRegionTypes.has("ANSWER"));
    assert(markSchemeRegionTypes.has("MARK_COLUMN"));
    assert(markSchemeRegionTypes.has("MARKING_INSTRUCTION"));
    assert(markSchemeStaging.pages.every((page) => page.source_blocks_json.some((block) => block.lineIndex !== undefined && block.spanIndex !== undefined && block.text)));
    assert(!markSchemeGate.checks.some((check) => check.code === "RESPONSE_AREA_COVERAGE_VALID"));
    assert(markSchemeGate.checks.some((check) => check.code === "MARK_SCHEME_REGION_VALID"));
    assert.equal(markSchemeGate.publishStatus, "READY_TO_PUBLISH");

    const damagedMarkScheme = structuredClone(markSchemeStaging);
    damagedMarkScheme.mark_scheme_entries = [];
    damagedMarkScheme.validation = validateStagingRecords(damagedMarkScheme);
    damagedMarkScheme.issues = damagedMarkScheme.validation.issues;
    assert(damagedMarkScheme.issues.some((issue) => issue.code === "ANSWER_STRUCTURE_INVALID"));
    assert.equal(evaluatePublishGate(damagedMarkScheme).publishStatus, "BLOCKED");
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function seedGeneratedAssets(pages, questions) {
  const leaves = questions.flatMap((question) => question.leafQuestions || []);
  const files = [
    ...leaves.filter((leaf) => leaf.questionImagePath).map((leaf) => leaf.questionImagePath),
    ...pages.map((page) => page.pageImagePath || path.posix.join("rendered", "0478-2025-MJ-12-QP", `page-${String(page.pageNumber).padStart(3, "0")}.webp`))
  ];
  files.forEach((relativePath) => {
    const filePath = path.join(rootDir, "output", "ingestion-samples", relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, Buffer.from("test-webp-placeholder"));
  });
}

function attachDiskCompleteness(staging) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-completeness-"));
  const stagingPath = path.join(tempDir, "fixture.staging.json");
  fs.writeFileSync(stagingPath, `${JSON.stringify(staging, null, 2)}\n`);
  staging.run.summary_json.canonicalCompletenessGate = runCanonicalCompletenessGate(stagingPath);
  const gate = evaluatePublishGate(staging);
  staging.run.summary_json.publishGate = gate;
  staging.run.publish_status = gate.publishStatus;
  staging.run.status = gate.publishStatus === "READY_TO_PUBLISH" ? "READY_TO_PUBLISH" : "NEEDS_REVIEW";
}
