const assert = require("node:assert/strict");
const path = require("node:path");
const { extractPdfGeometry, sliceQuestionPaper, suspiciousCharacterCount } = require("../src/ingestion");

assert.equal(suspiciousCharacterCount("Aérospatiale, Comté and Gruyère"), 0);
assert.equal(suspiciousCharacterCount("Tick ( ü ) one box."), 0);
assert.equal(suspiciousCharacterCount("Tick ( ü value."), 0);
assert.equal(suspiciousCharacterCount("Unexpected extracted glyph Î."), 1);

const rootDir = path.resolve(__dirname, "..");
const fixture = path.join(rootDir, "public", "textbook_syllabus", "pastpaper", "caie-igcse-0478", "2023-March", "0478_m23_qp_12.pdf");

(async () => {
  const geometry = await extractPdfGeometry(fixture);
  const questions = sliceQuestionPaper(geometry, { paperId: "0478-2023-FM-12" });
  assert.deepEqual(questions.map((question) => question.id), [
    "0478-2023-FM-12-Q1", "0478-2023-FM-12-Q2", "0478-2023-FM-12-Q3",
    "0478-2023-FM-12-Q4", "0478-2023-FM-12-Q5", "0478-2023-FM-12-Q6"
  ]);
  assert.deepEqual(questions.map((question) => question.marks), [10, 8, 9, 9, 19, 20]);
  assert(questions.every((question) => question.markValidation.valid));
  assert.equal(questions.reduce((sum, question) => sum + question.marks, 0), 75);
})().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
