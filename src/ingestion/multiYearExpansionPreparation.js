const fs = require("node:fs");
const path = require("node:path");
const { readProductionStore } = require("./productionPilot");
const { stagingArtifactEligibility } = require("./productionExpansion");

const TARGET_YEARS = [2020, 2021, 2022, 2023];
const TARGET_COMPONENTS = ["11", "12", "13", "21", "22", "23"];

function prepareMultiYearExpansion(options) {
  const pdfRoot = path.resolve(options.pdfRoot);
  const stagingDir = path.resolve(options.stagingDir);
  const storePath = path.resolve(options.storePath);
  const store = readProductionStore(storePath);
  const productionPaperIds = new Set((store.papers || []).map((paper) => paper.id));
  const pdfs = inventoryPdfs(pdfRoot);
  const matrix = TARGET_YEARS.flatMap((year) => TARGET_COMPONENTS.map((component) => {
    const key = `${year}:${component}`;
    const qpPdf = pdfs.get(`${key}:qp`) || null;
    const msPdf = pdfs.get(`${key}:ms`) || null;
    const code = String(year).slice(-2);
    const qpStagingPath = path.join(stagingDir, `0478_s${code}_qp_${component}.staging.json`);
    const msStagingPath = path.join(stagingDir, `0478_s${code}_ms_${component}.staging.json`);
    const qpId = `0478-${year}-MJ-${component}-QP`;
    const msId = `0478-${year}-MJ-${component}-MS`;
    return matrixEntry({ year, component, qpPdf, msPdf, qpStagingPath, msStagingPath, qpId, msId, productionPaperIds });
  }));
  const candidates = matrix.filter((entry) => entry.status === "ELIGIBLE");
  const missingArtifacts = matrix.filter((entry) => entry.status === "MISSING_STAGING");
  const recommendedBatch = selectRecommendedBatch(candidates, matrix);
  return {
    generatedFor: "PR-033_0478_Multi_Year_Expansion_Preparation_Plan",
    syllabus: "0478",
    years: TARGET_YEARS,
    session: "M/J",
    productionWrite: false,
    summary: {
      expectedPairs: matrix.length,
      availablePairs: matrix.filter((entry) => entry.qp.pdfAvailable && entry.ms.pdfAvailable).length,
      stagingPairs: matrix.filter((entry) => entry.qp.stagingAvailable && entry.ms.stagingAvailable).length,
      eligiblePairs: candidates.length,
      alreadyPublishedPairs: matrix.filter((entry) => entry.status === "ALREADY_PUBLISHED").length,
      blockedPairs: matrix.filter((entry) => entry.status === "BLOCKED").length,
      missingStagingPairs: missingArtifacts.length
    },
    coverageMatrix: matrix,
    missingArtifacts,
    expansionCandidates: candidates,
    recommendedBatch
  };
}

function matrixEntry(input) {
  const qp = artifactStatus(input.qpPdf, input.qpStagingPath, "question_paper");
  const ms = artifactStatus(input.msPdf, input.msStagingPath, "mark_scheme");
  const alreadyPublished = input.productionPaperIds.has(input.qpId) && input.productionPaperIds.has(input.msId);
  const blockers = [];
  if (!qp.pdfAvailable) blockers.push("QP_PDF_MISSING");
  if (!ms.pdfAvailable) blockers.push("MS_PDF_MISSING");
  if (!qp.stagingAvailable) blockers.push("QP_STAGING_MISSING");
  if (!ms.stagingAvailable) blockers.push("MS_STAGING_MISSING");
  blockers.push(...qp.blockers.map((value) => `QP_${value}`), ...ms.blockers.map((value) => `MS_${value}`));
  let status = "ELIGIBLE";
  if (alreadyPublished) status = "ALREADY_PUBLISHED";
  else if (!qp.stagingAvailable || !ms.stagingAvailable) status = "MISSING_STAGING";
  else if (blockers.length) status = "BLOCKED";
  return {
    syllabus: "0478",
    year: input.year,
    session: "M/J",
    component: input.component,
    pairingKey: `0478-${input.year}-MJ-${input.component}`,
    qpId: input.qpId,
    msId: input.msId,
    status,
    publishEligibility: status === "ELIGIBLE" ? "YES" : "NO",
    qp,
    ms,
    blockers
  };
}

function artifactStatus(pdfPath, stagingPath, expectedRole) {
  const stagingAvailable = fs.existsSync(stagingPath);
  const result = {
    pdfAvailable: Boolean(pdfPath),
    pdfPath,
    stagingAvailable,
    stagingPath,
    documentRole: null,
    validationStatus: null,
    completenessStatus: null,
    completenessChecks: null,
    publishStatus: null,
    blockers: []
  };
  if (!stagingAvailable) return result;
  const staging = JSON.parse(fs.readFileSync(stagingPath, "utf8"));
  const completeness = staging.run?.summary_json?.canonicalCompletenessGate || null;
  result.documentRole = staging.papers?.[0]?.document_role || null;
  result.validationStatus = staging.validation?.status || null;
  result.completenessStatus = completeness?.status || null;
  result.completenessChecks = completeness?.checks || null;
  result.publishStatus = staging.run?.publish_status || null;
  result.blockers = stagingArtifactEligibility(stagingPath, expectedRole).blockers;
  return result;
}

function inventoryPdfs(pdfRoot) {
  const files = walk(pdfRoot).filter((file) => /\.pdf$/i.test(file));
  const inventory = new Map();
  files.forEach((file) => {
    const match = path.basename(file).match(/^0478_s(20|21|22|23)_(qp|ms)_(11|12|13|21|22|23)\.pdf$/i);
    if (!match) return;
    const year = 2000 + Number(match[1]);
    inventory.set(`${year}:${match[3]}:${match[2].toLowerCase()}`, file);
  });
  return inventory;
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function selectRecommendedBatch(candidates, matrix) {
  const groups = candidates.reduce((map, candidate) => {
    map.set(candidate.year, [...(map.get(candidate.year) || []), candidate]);
    return map;
  }, new Map());
  const choices = [...groups.entries()].filter(([year]) => year !== 2023).sort((a, b) => a[1].length - b[1].length || b[0] - a[0]);
  const [year, eligibleEntries] = choices[0] || [null, []];
  const entries = eligibleEntries.slice(0, 2);
  const publishedInYear = matrix.filter((entry) => entry.year === year && entry.status === "ALREADY_PUBLISHED").length;
  const batchNumber = Math.floor(publishedInYear / 2) + 1;
  const firstProductionPr = year === 2020 ? 35 : year === 2021 ? 39 : year === 2022 ? 43 : 38;
  const prNumber = firstProductionPr + (year === 2022 ? publishedInYear : Math.floor(publishedInYear / 2));
  const pr = `PR${String(prNumber).padStart(3, "0")}`;
  return {
    batchId: year ? `${pr}-0478-${year}-MJ-BATCH-${String(batchNumber).padStart(2, "0")}` : null,
    rationale: year ? "First controlled two-pair batch from the next validated unpublished year." : "No eligible unpublished candidates.",
    year,
    components: entries.map((entry) => entry.component),
    pairCount: entries.length,
    pairingKeys: entries.map((entry) => entry.pairingKey),
    productionWrite: false
  };
}

module.exports = { TARGET_COMPONENTS, TARGET_YEARS, prepareMultiYearExpansion };
