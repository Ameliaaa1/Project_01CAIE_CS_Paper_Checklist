const fs = require("node:fs");
const path = require("node:path");
const { stagingArtifactEligibility } = require("./productionExpansion");

const TARGET_COMPONENTS = ["11", "13", "21", "22", "23"];

function generateStagingCoverageReport(options) {
  const stagingDir = path.resolve(options.stagingDir);
  const components = TARGET_COMPONENTS.map((component) => {
    const qpStagingPath = path.join(stagingDir, `0478_s23_qp_${component}.staging.json`);
    const msStagingPath = path.join(stagingDir, `0478_s23_ms_${component}.staging.json`);
    const qp = coverageForArtifact(qpStagingPath, "question_paper");
    const ms = coverageForArtifact(msStagingPath, "mark_scheme");
    return {
      component,
      status: qp.status === "PASS" && ms.status === "PASS" ? "READY" : "BLOCKED",
      qp,
      ms,
      blockers: [...qp.blockers.map((code) => `QP_${code}`), ...ms.blockers.map((code) => `MS_${code}`)]
    };
  });
  return {
    batchId: options.batchId || "PR028-0478-2023-MJ",
    generatedFor: "PR-029_Generate_Missing_Production_Expansion_Staging_Coverage_Explanation",
    scope: { syllabus: "0478", year: 2023, session: "M/J", components: TARGET_COMPONENTS },
    components,
    eligibleCount: components.filter((component) => component.status === "READY").length,
    blockedCount: components.filter((component) => component.status === "BLOCKED").length,
    productionWrite: false
  };
}

function coverageForArtifact(stagingPath, expectedRole) {
  if (!fs.existsSync(stagingPath)) return { path: stagingPath, status: "MISSING", blockers: ["MISSING_STAGING"] };
  const staging = JSON.parse(fs.readFileSync(stagingPath, "utf8"));
  const eligibility = stagingArtifactEligibility(stagingPath, expectedRole);
  const questions = staging.questions || [];
  const leaves = questions.filter((question) => question.is_leaf);
  const requiredLeaves = leaves.filter((question) => Number(question.marks || 0) > 0);
  const responsePresent = requiredLeaves.filter((question) => question.response_area_status === "PRESENT" && (question.response_areas_json || []).length > 0);
  return {
    path: stagingPath,
    status: eligibility.eligible ? "PASS" : "FAIL",
    documentRole: staging.papers?.[0]?.document_role || null,
    validationStatus: staging.validation?.status || null,
    completenessStatus: staging.run?.summary_json?.canonicalCompletenessGate?.status || null,
    completenessPublishable: staging.run?.summary_json?.canonicalCompletenessGate?.publishable === true,
    publishStatus: staging.run?.publish_status || null,
    questionCount: questions.filter((question) => !question.is_leaf || (Number(question.depth) === 0 && !question.parent_question_id)).length,
    leafQuestionCount: leaves.length,
    markSchemeEntryCount: (staging.mark_scheme_entries || []).length,
    responseAreaCoverage: {
      required: requiredLeaves.length,
      present: responsePresent.length,
      ratio: requiredLeaves.length ? Number((responsePresent.length / requiredLeaves.length).toFixed(4)) : 1
    },
    sourceTraceAvailable: expectedRole === "mark_scheme"
      ? (staging.mark_scheme_entries || []).every((entry) => entry.sourceTrace)
      : (staging.pages || []).some((page) => (page.source_blocks_json || []).length > 0),
    issueCodes: (staging.issues || []).map((issue) => issue.code),
    blockers: eligibility.blockers
  };
}

module.exports = { TARGET_COMPONENTS, generateStagingCoverageReport };
