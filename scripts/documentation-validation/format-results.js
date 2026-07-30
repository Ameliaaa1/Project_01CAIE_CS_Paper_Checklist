"use strict";

function sortFindings(findings) {
  return [...findings].sort((a, b) =>
    [
      a.path || "",
      String(a.line || a.pointer || ""),
      a.ruleId,
      a.message,
    ].join("\0").localeCompare(
      [b.path || "", String(b.line || b.pointer || ""), b.ruleId, b.message].join("\0"),
    ),
  );
}

function formatText(result) {
  const lines = [
    `Result: ${result.result}`,
    `Mode: ${result.mode}`,
    `Documents: ${result.summary.documents}`,
    `Links: ${result.summary.linksChecked}`,
    `Findings: ${result.summary.blockingFindings} blocking, ${result.summary.baselinedFindings} baselined`,
  ];
  if (result.errorCode) lines.push(`Error code: ${result.errorCode}`);
  if (result.error) {
    if (result.error.path) lines.push(`Error path: ${result.error.path}`);
    lines.push(`Error: ${result.error.message}`);
  }
  for (const finding of result.findings) {
    const location = finding.line ? `:${finding.line}` : finding.pointer ? `:${finding.pointer}` : "";
    lines.push(
      `${finding.ruleId} ${finding.severity} ${finding.path}${location}`,
      finding.message,
      `Expected: ${finding.expected}`,
      `Actual: ${finding.actual}`,
      `Baseline: ${finding.baselineStatus}`,
    );
  }
  return `${lines.join("\n")}\n`;
}

module.exports = {
  formatText,
  sortFindings,
};
