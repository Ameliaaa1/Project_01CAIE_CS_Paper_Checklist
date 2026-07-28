const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  extractPdfGeometry,
  parsePaperPath,
  suspiciousCharacterCount,
  sliceQuestionPaper
} = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const paperRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper");
const fixturePath = path.join(paperRoot, "caie-igcse-0478", "2025-May-June", "0478_s25_qp_12.pdf");

(async () => {
  if (!fs.existsSync(fixturePath)) {
    console.warn("Skipping ingestion golden fixture test because the sample PDF is not present.");
    return;
  }

  const paper = parsePaperPath(fixturePath, paperRoot);
  const geometry = await extractPdfGeometry(fixturePath);
  const questions = sliceQuestionPaper(geometry, { paperId: paper.paperGroupId });
  const leaves = questions.flatMap((question) => question.leafQuestions || []);
  const q5 = questions.find((question) => question.questionNumber === "5");
  const leafByNumber = new Map(leaves.map((leaf) => [leaf.questionNumber, leaf]));
  const serialized = JSON.stringify({ paper, questions });

  assert.equal(geometry.pageCount, 12);
  assert.equal(geometry.pages[0].pageType, "cover");
  assert.deepEqual(geometry.pages[0].contentRegions.map((region) => region.type).sort(), ["barcode", "cover_metadata", "instructions"]);
  assert(!geometry.pages[0].contentRegions.some((region) => region.type === "question_content"));
  assert.equal(questions.length, 5);
  assert.equal(questions.reduce((sum, question) => sum + (question.marks || 0), 0), 75);
  assert.equal(leaves.length, 27);
  assert.equal(leaves.reduce((sum, question) => sum + (question.marks || 0), 0), 75);

  assert.deepEqual(Object.fromEntries(questions.map((question) => [question.questionNumber, [question.pageStart, question.pageEnd]])), {
    1: [2, 3],
    2: [4, 5],
    3: [6, 8],
    4: [9, 9],
    5: [10, 12]
  });

  assert(q5, "Q5 should be extracted");
  assert.equal(q5.pageEnd, 12, "Q5 should include the final content page");
  assert.equal(q5.marks, 23, "Q5 should include the final 6-mark subquestion");
  assert(!/Permission to reproduce|Cambridge Assessment/.test(q5.text), "Q5 should not include copyright back matter");
  assert(!/[ĬĀĂĄĈĊČĎĐĒĔĖĘĚĜĞĠĢĤĦĨĪĬÎÏÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïú¾´õùûþ×¸¶¬¦¤ªºµ·¿À-Þ]/.test(q5.text), "Q5 should not include corrupt PDF glyphs");

  const expectedLeafPages = {
    "1(a)": [2, 2],
    "1(b)": [2, 2],
    "1(c)": [2, 2],
    "1(d)": [2, 2],
    "1(e)": [3, 3],
    "1(f)": [3, 3],
    "1(g)": [3, 3],
    "2(a)": [4, 4],
    "2(b)(i)": [4, 4],
    "2(b)(ii)": [4, 4],
    "2(c)(i)": [4, 4],
    "2(c)(ii)": [4, 4],
    "2(d)": [5, 5],
    "3(a)": [6, 6],
    "3(b)(i)": [6, 6],
    "3(b)(ii)": [7, 7],
    "3(c)(i)": [7, 7],
    "3(c)(ii)": [7, 7],
    "3(c)(iii)": [8, 8],
    "4(a)": [9, 9],
    "4(b)": [9, 9],
    "5(a)": [10, 10],
    "5(b)(i)": [10, 10],
    "5(b)(ii)": [10, 10],
    "5(b)(iii)": [11, 11],
    "5(c)(i)": [11, 11],
    "5(c)(ii)": [12, 12]
  };
  assert.deepEqual(Object.fromEntries(leaves.map((leaf) => [leaf.questionNumber, [leaf.pageStart, leaf.pageEnd]])), expectedLeafPages);

  assert.equal(questions[0].id, "0478-2025-MJ-12-Q1");
  assert.equal(leafByNumber.get("2(b)(i)").id, "0478-2025-MJ-12-Q2-B-I");
  assert.equal(leafByNumber.get("5(c)(ii)").parentQuestionId, "0478-2025-MJ-12-Q5");
  assert.equal(leaves.filter((leaf) => questions.some((question) => question.id === leaf.parentQuestionId)).length, leaves.length);
  assert(!serialized.match(/Q\d-Q\d/), "question IDs should not repeat the top-level question segment");

  assert.match(leafByNumber.get("2(b)(i)").contextText, /3072 bytes/);
  assert.match(leafByNumber.get("2(b)(i)").displayText, /3072 bytes[\s\S]*kibibytes/);

  assert.equal(geometry.pages.filter((page) => page.requiresOcr).length, 0, "text-layer fixture should not require OCR");
  assert.equal(geometry.pages[11].pageType, "mixed");
  assert.equal(geometry.pages[11].containsBackMatter, true);
  assert(!geometry.pages[11].displayText.includes("Permission to reproduce"));
  assert(!geometry.pages[11].displayText.startsWith("12 , ,"));
  const page5 = geometry.pages[4];
  assert(page5.excludedSpans.some((span) => span.blockIndex === 12 && span.regionType === "barcode"));
  assert(page5.excludedSpans.some((span) => span.blockIndex === 11 && span.regionType === "footer"));
  assert(page5.excludedSpans.some((span) => span.regionType === "margin"));
  assert(!page5.sourceBlocks.some((block) => [11, 12, 13].includes(block.blockIndex)));
  assert.match(page5.displayText, /lossless compression/);
  assert.doesNotMatch(page5.displayText, /ċñ|¹ě|0478\/12\/M\/J\/25|\[Turn over\]/);
  assert.doesNotMatch(page5.normalizedText, /0478\/12\/M\/J\/25|Turn over|UCLES|DO NOT WRITE IN THIS MARGIN|[\u0000-\u001f\u007f-\u009f]/);
  assert.equal(page5.textQuality.displaySuspiciousGlyphCount, 0);
  geometry.pages.forEach((page) => {
    assert.doesNotMatch(page.displayText, /\b0478\/12\/M\/J\/25\b/);
    assert.doesNotMatch(page.displayText, /\*\s*(?:\d\s*){8,16}\*/);
    assert.doesNotMatch(page.displayText, /\[Turn over\]/);
    assert.doesNotMatch(page.normalizedText, /\*\s*(?:\d\s*){8,16}\*|\b\d{4}\/\d{2}\/[A-Z]\/[A-Z]\/\d{2}\b|\bTurn over\b|\bUCLES\b|\bDO NOT WRITE IN THIS MARGIN\b|[\u0000-\u001f\u007f-\u009f]/i);
    assert.equal(page.textQuality.normalizedSuspiciousGlyphCount, suspiciousCharacterCount(page.normalizedText));
    assert.equal(page.textQuality.displaySuspiciousGlyphCount, suspiciousCharacterCount(page.displayText));
  });
  geometry.pages.slice(1, 11).forEach((page) => {
    assert.equal(page.textQuality.displaySuspiciousGlyphCount, 0);
  });
  assert.equal(suspiciousCharacterCount("μ"), 0);

  const visualLeaves = leaves.filter((leaf) => leaf.hasVisualContent).map((leaf) => [leaf.questionNumber, leaf.visualType, leaf.questionImagePath]);
  assert.deepEqual(visualLeaves, [
    ["2(a)", "tick_box", "rendered/0478-2025-MJ-12-QP/Q2-A.webp"],
    ["4(a)", "table", "rendered/0478-2025-MJ-12-QP/Q4-A.webp"],
    ["5(c)(i)", "diagram", "rendered/0478-2025-MJ-12-QP/Q5-C-I.webp"]
  ]);
  assert.equal(leafByNumber.get("5(c)(ii)").hasVisualContent, false);
  assert.match(geometry.pages[2].displayText, /01100101/);
  assert.match(geometry.pages[2].displayText, /01110000/);
  assert.match(leafByNumber.get("1(g)").searchText, /-22/);
  assert.match(geometry.pages[3].displayText, /✓/);

  questions.forEach((question) => {
    assert.equal(question.markValidation.valid, true);
    assert.equal(question.reviewStatus, "AUTO_CANDIDATE");
    assert.equal(question.issues.length, 0);
    assert.equal(question.confidence.structure >= 0.9, true);
  });
  leaves.forEach((leaf) => {
    assert.equal(leaf.reviewStatus, "AUTO_CANDIDATE");
    assert.equal(leaf.issues.length, 0);
  });

  assert(!serialized.includes(rootDir), "ingestion records should not persist local absolute workspace paths");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
