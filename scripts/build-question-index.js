const fs = require("node:fs");
const path = require("node:path");
const { PDFParse } = require("pdf-parse");
const { syllabusChecklist } = require("../public/assets/paperlens-data");

const rootDir = path.resolve(__dirname, "..");
const paperRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper");
const outputPath = path.join(rootDir, "generated", "question-index.json");
const stopWords = new Set([
  "about", "after", "again", "also", "answer", "before", "being", "below", "computer", "correct", "data", "describe",
  "different", "each", "explain", "following", "from", "give", "identify", "into", "more", "name", "other", "question",
  "state", "system", "than", "that", "their", "there", "these", "this", "three", "using", "which", "with", "write"
]);

async function main() {
  const syllabusSections = loadSyllabusSections();
  const classifier = buildSectionClassifier(syllabusSections);
  const qpPaths = findFiles(paperRoot).filter((filePath) => /_qp_\d+\.pdf$/i.test(filePath)).sort();
  const entries = [];

  for (let index = 0; index < qpPaths.length; index += 1) {
    const qpPath = qpPaths[index];
    const paper = paperCodeFromPath(qpPath);
    if (!paper) continue;

    const qpGeometry = await parsePdfGeometry(qpPath);
    const qpQuestions = questionRegions(qpGeometry, "qp");

    qpQuestions.forEach((question) => {
      const section = classifySection(question.text, classifier) || "unknown";
      const sectionTitle = syllabusSections.find((item) => item.code === section)?.title || "Syllabus topic";
      entries.push({
        syllabusId: "caie-igcse-0478",
        section,
        paper,
        ref: `Q${question.number}`,
        knowledge: `${sectionTitle} - past-paper question`,
        question: question.text,
        answer: "",
        autoIndexed: true
      });
    });

    process.stdout.write(`\rIndexed ${index + 1}/${qpPaths.length} question papers`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), papers: qpPaths.length, questions: entries.length, entries }, null, 2)}\n`);
  process.stdout.write(`\nWrote ${entries.length} questions to ${path.relative(rootDir, outputPath)}\n`);
}

function loadSyllabusSections() {
  return Object.values(syllabusChecklist).flatMap((chapters) =>
    chapters.flatMap((chapter) => chapter.sections.map((section) => ({
      code: section.code,
      title: section.title,
      text: `${chapter.title} ${section.title} ${(section.items || []).join(" ")}`
    })))
  );
}

function buildSectionClassifier(sections) {
  const documents = sections.map((section) => new Set(contentTokens(section.text)));
  const frequencies = new Map();
  documents.forEach((tokens) => tokens.forEach((token) => frequencies.set(token, (frequencies.get(token) || 0) + 1)));
  return sections.map((section, index) => ({
    ...section,
    weights: new Map([...documents[index]].map((token) => [token, Math.log((sections.length + 1) / ((frequencies.get(token) || 0) + 1)) + 1]))
  }));
}

function classifySection(text, classifier) {
  const tokens = new Set(contentTokens(text));
  let best = null;
  classifier.forEach((section) => {
    let score = 0;
    section.weights.forEach((weight, token) => {
      if (tokens.has(token)) score += weight * (token.length >= 7 ? 1.25 : 1);
    });
    if (!best || score > best.score) best = { code: section.code, score };
  });
  return best && best.score >= 5 ? best.code : null;
}

function contentTokens(value) {
  return normaliseText(value).split(" ").filter((token) => token.length > 3 && !stopWords.has(token));
}

function findFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? findFiles(entryPath) : [entryPath];
  });
}

function paperCodeFromPath(filePath) {
  const match = path.basename(filePath).match(/^0478_([msw])(\d{2})_qp_(\d{2})\.pdf$/i);
  if (!match) return null;
  const [, seasonCode, year, component] = match;
  const season = { m: "F/M", s: "M/J", w: "O/N" }[seasonCode.toLowerCase()];
  return season ? `0478/${component}/${season}/${year}` : null;
}

async function parsePdfGeometry(filePath) {
  const parser = new PDFParse({ data: fs.readFileSync(filePath) });
  try {
    const document = await parser.load();
    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      const items = content.items
        .filter((item) => "str" in item && item.str.trim())
        .map((item) => ({
          text: item.str.trim(),
          x: Number(item.transform[4]),
          y: Number(item.transform[5]),
          width: Number(item.width || 0),
          height: Math.max(8, Math.abs(Number(item.height || item.transform[3] || 10)))
        }));
      pages.push({ page: pageNumber, width: viewport.width, height: viewport.height, items });
      page.cleanup();
    }
    return pages;
  } finally {
    await parser.destroy();
  }
}

function questionRegions(geometry, type) {
  const markers = [];
  let missing = 0;
  for (let number = 1; number <= 30 && missing < 4; number += 1) {
    const marker = findQuestionMarker(geometry, number, type);
    if (marker) {
      markers.push({ number, ...marker });
      missing = 0;
    } else if (markers.length) {
      missing += 1;
    }
  }

  return markers.map((marker, index) => ({
    number: marker.number,
    text: textBetween(geometry, marker, markers[index + 1] || null)
  })).filter((question) => question.text.length > 20);
}

function findQuestionMarker(geometry, questionNumber, type) {
  for (const page of geometry) {
    const candidates = page.items.filter((item) => {
      if (item.x >= page.width * 0.13 || item.y <= 42 || item.y >= page.height - 20) return false;
      return type === "ms"
        ? new RegExp(`^${questionNumber}(?:\\([a-z]\\)|$)`, "i").test(item.text)
        : item.text === String(questionNumber);
    });
    if (candidates.length) {
      const item = candidates.sort((a, b) => b.y - a.y)[0];
      return { page: page.page, ...item };
    }
  }
  return null;
}

function textBetween(geometry, start, end) {
  const output = [];
  geometry.forEach((page) => {
    if (page.page < start.page || (end && page.page > end.page)) return;
    page.items
      .filter((item) => item.y > 35 && item.y < page.height - 35 && item.x < page.width * 0.92)
      .map((item) => ({ page: page.page, ...item }))
      .filter((item) => comparePosition(item, start) >= 0 && (!end || comparePosition(item, end) < 0))
      .sort((a, b) => b.y - a.y || a.x - b.x)
      .forEach((item) => output.push(item.text));
  });
  return output.join(" ").replace(/\s+/g, " ").trim();
}

function comparePosition(a, b) {
  if (a.page !== b.page) return a.page - b.page;
  return b.y - a.y;
}

function normaliseText(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
