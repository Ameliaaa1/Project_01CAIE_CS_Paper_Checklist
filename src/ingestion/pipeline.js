const { scanPaperDirectory } = require("./scanner");
const { createDeferredPdfAdapter } = require("./pdfAdapter");

async function runIngestion(options = {}) {
  if (!options.dir) {
    throw new Error("runIngestion requires a PDF directory.");
  }

  const scan = await scanPaperDirectory(options.dir, {
    subject: options.subject,
    role: options.role
  });
  const pdfAdapter = options.pdfAdapter || createDeferredPdfAdapter();
  const records = scan.papers.map((paper) => ({
    paper,
    status: options.dryRun ? "SCANNED" : "PDF_PROCESSING_DEFERRED",
    issues: options.dryRun
      ? []
      : [{
          stage: "extract",
          errorCode: "PDF_ADAPTER_NOT_CONNECTED",
          severity: "INFO",
          message: `${pdfAdapter.name} is registered, but page extraction is not part of the base framework yet.`
        }]
  }));

  return {
    ok: true,
    root: scan.root,
    dryRun: Boolean(options.dryRun),
    pdfAdapter: pdfAdapter.name,
    summary: {
      scanned: scan.papers.length,
      issues: scan.issues.length + records.reduce((total, record) => total + record.issues.length, 0),
      byRole: countBy(scan.papers, "role"),
      bySubject: countBy(scan.papers, "subjectCode")
    },
    papers: records,
    issues: scan.issues
  };
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key] || "UNKNOWN";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

module.exports = {
  runIngestion
};
