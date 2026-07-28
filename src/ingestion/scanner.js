const fs = require("node:fs/promises");
const path = require("node:path");
const { sha256File } = require("./hash");
const { parsePaperPath } = require("./paperFilename");

async function findPdfFiles(directory) {
  const root = path.resolve(directory);
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) return findPdfFiles(entryPath);
    return entry.isFile() && entry.name.toLowerCase().endsWith(".pdf") ? [entryPath] : [];
  }));
  return files.flat().sort();
}

async function scanPaperDirectory(directory, options = {}) {
  const root = path.resolve(directory);
  const files = await findPdfFiles(root);
  const papers = [];
  const issues = [];

  for (const filePath of files) {
    const parsed = parsePaperPath(filePath, root);
    if (!parsed) {
      issues.push({
        stage: "scan",
        errorCode: "FILENAME_UNRECOGNISED",
        severity: "WARNING",
        sourcePath: path.relative(root, filePath),
        message: "PDF filename does not match the supported CAIE pattern."
      });
      continue;
    }

    if (options.subject && parsed.subjectCode !== String(options.subject)) continue;
    if (options.role && parsed.roleCode !== String(options.role).toLowerCase()) continue;

    const stats = await fs.stat(filePath);
    papers.push({
      ...parsed,
      sourcePath: path.relative(root, filePath),
      relativePath: path.relative(root, filePath),
      fileSize: stats.size,
      fileHash: await sha256File(filePath)
    });
  }

  return { root, papers, issues };
}

module.exports = {
  findPdfFiles,
  scanPaperDirectory
};
