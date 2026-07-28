const path = require("node:path");

const sessionLabels = {
  m: "F/M",
  s: "M/J",
  w: "O/N"
};

const documentRoles = {
  qp: "QP",
  ms: "MS",
  pm: "PM"
};

const roleAliases = {
  qp: "qp",
  questionpaper: "qp",
  question_paper: "qp",
  ms: "ms",
  markscheme: "ms",
  mark_scheme: "ms",
  pm: "pm",
  preleasematerial: "pm",
  pre_release_material: "pm"
};

const sessionAliases = {
  m: "m",
  fm: "m",
  febmarch: "m",
  s: "s",
  mj: "s",
  mayjune: "s",
  w: "w",
  on: "w",
  octnov: "w"
};

function parsePaperFilename(filename) {
  const basename = path.basename(String(filename || ""));
  const compact = basename
    .replace(/\.pdf$/i, "")
    .trim()
    .replace(/[\s-]+/g, "_");
  const match = compact.match(/^(\d{4})_?([a-z_]+?)(\d{2})_?([a-z_]+?)_?(\d{2})$/i);
  if (!match) return null;

  const [, subjectCode, rawSessionCode, rawYearCode, rawRole, component] = match;
  const sessionCode = sessionAliases[rawSessionCode.toLowerCase().replace(/_/g, "")];
  const roleKey = rawRole.toLowerCase();
  const roleCode = roleAliases[roleKey] || roleAliases[roleKey.replace(/_/g, "")];
  if (!sessionCode || !roleCode) return null;
  const yearCode = Number(rawYearCode);
  const year = yearCode >= 70 ? 1900 + yearCode : 2000 + yearCode;
  const paperNumber = component.slice(0, 1);
  const variant = component.slice(1);
  const paperGroupId = [
    subjectCode,
    sessionCode,
    rawYearCode,
    component
  ].join("_");

  return {
    subjectCode,
    year,
    yearCode: rawYearCode,
    sessionCode,
    session: sessionLabels[sessionCode],
    role: documentRoles[roleCode],
    roleCode,
    component,
    paperNumber,
    variant,
    paperGroupId,
    normalizedName: `${subjectCode}_${sessionCode}${rawYearCode}_${roleCode}_${component}.pdf`
  };
}

function parsePaperPath(filePath, rootDir = process.cwd()) {
  const parsed = parsePaperFilename(filePath);
  if (!parsed) return null;

  return {
    ...parsed,
    sourcePath: path.relative(path.resolve(rootDir), path.resolve(filePath)),
    relativePath: path.relative(path.resolve(rootDir), path.resolve(filePath))
  };
}

module.exports = {
  parsePaperFilename,
  parsePaperPath,
  sessionLabels,
  documentRoles,
  roleAliases,
  sessionAliases
};
