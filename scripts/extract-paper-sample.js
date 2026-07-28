#!/usr/bin/env node

const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const canvasTools = require("@napi-rs/canvas");
const {
  extractPdfGeometry,
  parsePaperPath,
  applyDocumentProfile,
  publicPageSummary,
  sha256File,
  stablePaperGroupId,
  sliceQuestionPaper
} = require("../src/ingestion");

const rootDir = path.resolve(__dirname, "..");
const paperRoot = path.join(rootDir, "public", "textbook_syllabus", "pastpaper");
const defaultPaper = path.join(paperRoot, "caie-igcse-0478", "2025-May-June", "0478_s25_qp_12.pdf");
const outputDir = path.join(rootDir, "output", "ingestion-samples");

async function main() {
  const filePath = path.resolve(process.argv[2] || defaultPaper);
  const paper = parsePaperPath(filePath, paperRoot);
  if (!paper) throw new Error(`Unsupported CAIE paper filename: ${filePath}`);
  const stableGroupId = stablePaperGroupId(paper.paperGroupId);

  const geometry = await extractPdfGeometry(filePath);
  const questions = paper.role === "QP" ? sliceQuestionPaper(geometry, { paperId: paper.paperGroupId }) : [];
  const profiled = applyDocumentProfile({
    generatedAt: new Date().toISOString(),
    sourceFile: path.relative(rootDir, filePath),
    paper: {
      ...paper,
      id: `${stableGroupId}-${paper.role}`,
      paperGroupId: stableGroupId,
      documentRole: documentRoleForPaper(paper.role),
      storageKey: path.posix.join("pastpaper", paper.relativePath.split(path.sep).join("/")),
      schemaVersion: "1.0.0",
      parserVersion: "0.4.0",
      fileHash: await sha256File(filePath)
    },
    pages: geometry.pages,
    questions: questions.map((question) => ({
      ...question,
      textPreview: question.text.slice(0, 360),
      text: question.text
    }))
  });
  const payload = {
    ...profiled,
    pages: profiled.pages.map(publicPageSummary)
  };

  fs.mkdirSync(outputDir, { recursive: true });
  await generatePageImagesAndQuestionCrops(filePath, payload);
  const outputPath = path.join(outputDir, `${paper.normalizedName.replace(/\.pdf$/i, "")}.sample.json`);
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);

  process.stdout.write(`${JSON.stringify({
    outputPath,
    sourceFile: payload.sourceFile,
    pageCount: payload.pages.length,
    questionCount: payload.questions.length,
    questions: payload.questions.map((question) => ({
      questionNumber: question.questionNumber,
      pageStart: question.pageStart,
      pageEnd: question.pageEnd,
      marks: question.marks,
      confidence: question.confidence,
      textPreview: question.textPreview
    }))
  }, null, 2)}\n`);
}

function documentRoleForPaper(role) {
  if (role === "QP") return "question_paper";
  if (role === "MS") return "mark_scheme";
  if (role === "PM") return "pre_release_material";
  return String(role || "unknown").toLowerCase();
}

async function generatePageImagesAndQuestionCrops(filePath, payload) {
  const visualLeaves = payload.questions.flatMap((question) => question.leafQuestions || []).filter((leaf) => leaf.questionImagePath && leaf.bbox);
  const pdftoppm = resolvePdfToPpm();
  if (!fs.existsSync(pdftoppm)) return;

  const tempDir = path.join(outputDir, ".rendered-pages");
  fs.mkdirSync(tempDir, { recursive: true });
  const renderedRoot = path.join("rendered", payload.paper.id);

  for (const page of payload.pages) {
    const pageNumber = page.pageNumber;
    const pagePrefix = path.join(tempDir, `page-${String(pageNumber).padStart(3, "0")}`);
    const pagePng = `${pagePrefix}.png`;
    if (!fs.existsSync(pagePng)) {
      execFileSync(pdftoppm, ["-png", "-r", "144", "-f", String(pageNumber), "-l", String(pageNumber), "-singlefile", filePath, pagePrefix], {
        stdio: "ignore"
      });
    }
    const image = await canvasTools.loadImage(pagePng);
    const canvas = canvasTools.createCanvas(image.width, image.height);
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    page.pageImagePath = path.posix.join(renderedRoot, `page-${String(pageNumber).padStart(3, "0")}.webp`);
    const pageImagePath = path.join(outputDir, page.pageImagePath);
    fs.mkdirSync(path.dirname(pageImagePath), { recursive: true });
    fs.writeFileSync(pageImagePath, canvas.toBuffer("image/webp"));
  }

  if (!visualLeaves.length) return;

  for (const leaf of visualLeaves) {
    const pageNumber = leaf.pageStart;
    const page = payload.pages.find((candidate) => candidate.pageNumber === pageNumber);
    if (!page) continue;

    const pagePrefix = path.join(tempDir, `page-${String(pageNumber).padStart(3, "0")}`);
    const pagePng = `${pagePrefix}.png`;
    if (!fs.existsSync(pagePng)) {
      execFileSync(pdftoppm, ["-png", "-r", "144", "-f", String(pageNumber), "-l", String(pageNumber), "-singlefile", filePath, pagePrefix], {
        stdio: "ignore"
      });
    }

    const image = await canvasTools.loadImage(pagePng);
    const scaleX = image.width / page.width;
    const scaleY = image.height / page.height;
    const padding = 36;
    const x = Math.max(0, Math.floor(leaf.bbox.xMin * scaleX) - padding);
    const y = Math.max(0, Math.floor((page.height - leaf.bbox.yMax) * scaleY) - padding);
    const right = Math.min(image.width, Math.ceil(leaf.bbox.xMax * scaleX) + padding);
    const bottom = Math.min(image.height, Math.ceil((page.height - leaf.bbox.yMin) * scaleY) + padding);
    const width = Math.max(1, right - x);
    const height = Math.max(1, bottom - y);
    const canvas = canvasTools.createCanvas(width, height);
    const context = canvas.getContext("2d");
    context.drawImage(image, x, y, width, height, 0, 0, width, height);

    const cropPath = path.join(outputDir, leaf.questionImagePath);
    fs.mkdirSync(path.dirname(cropPath), { recursive: true });
    fs.writeFileSync(cropPath, canvas.toBuffer("image/webp"));
  }
}

function resolvePdfToPpm() {
  const candidates = [
    process.env.PDFTOPPM,
    "/Users/amelia/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/pdftoppm",
    "/Users/amelia/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override/pdftoppm"
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  try {
    const found = execFileSync("which", ["pdftoppm"], { encoding: "utf8" }).trim();
    if (found) return found;
  } catch {
    // Page images are optional for extraction-only environments.
  }
  return candidates[0] || "pdftoppm";
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
