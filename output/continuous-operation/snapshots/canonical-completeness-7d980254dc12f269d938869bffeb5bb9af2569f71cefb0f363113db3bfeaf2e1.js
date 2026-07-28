const fs = require("node:fs");
const path = require("node:path");

const CHECK_NAMES = [
  "questionCoverage",
  "leafCoverage",
  "markCoverage",
  "responseAreaCoverage",
  "sourceTraceCoverage",
  "canonicalStructureCompleteness"
];

function runCanonicalCompletenessGate(stagingPath) {
  const resolvedPath = path.resolve(stagingPath);
  const staging = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
  return evaluateCanonicalCompleteness(staging, { stagingPath: resolvedPath });
}

function evaluateCanonicalCompleteness(staging, options = {}) {
  const issues = [];
  const role = staging.papers?.[0]?.document_role || "unknown";
  const isQuestionPaper = role === "question_paper";
  const questions = staging.questions || [];
  const parents = questions.filter((question) => !question.is_leaf);
  const leaves = questions.filter((question) => question.is_leaf);
  const topLevelQuestions = questions.filter((question) => !question.is_leaf || (Number(question.depth) === 0 && !question.parent_question_id));
  const entries = staging.mark_scheme_entries || [];
  const pages = staging.pages || [];

  checkQuestionCoverage({ isQuestionPaper, parents: topLevelQuestions, entries, issues });
  checkLeafCoverage({ isQuestionPaper, parents, leaves, issues });
  checkMarkCoverage({ isQuestionPaper, parents, leaves, entries, issues });
  checkResponseAreaCoverage({ isQuestionPaper, leaves, issues });
  checkSourceTraceCoverage({ staging, isQuestionPaper, questions, entries, pages, issues });
  checkCanonicalStructure({ questions, parents, leaves, pages, issues });

  const checks = Object.fromEntries(CHECK_NAMES.map((name) => [name, checkStatus(name, issues)]));
  const hasP0 = issues.some((issue) => issue.severity === "P0");
  const hasP1 = issues.some((issue) => issue.severity === "P1");
  return {
    status: hasP0 ? "FAIL" : hasP1 ? "WARN" : "PASS",
    publishable: !hasP0 && !hasP1,
    stagingPath: options.stagingPath || null,
    documentRole: role,
    checks,
    summary: {
      questionCount: topLevelQuestions.length,
      leafQuestionCount: leaves.length,
      markSchemeEntryCount: entries.length,
      responseAreaCoverage: responseAreaCoverage(leaves)
    },
    issues
  };
}

function checkQuestionCoverage({ isQuestionPaper, parents, entries, issues }) {
  const records = isQuestionPaper ? parents : entries;
  if (!records.length) {
    addIssue(issues, "P0", "CANONICAL_QUESTION_COVERAGE_INCOMPLETE", "questionCoverage", "Canonical question or mark-scheme entry coverage is empty.");
    return;
  }
  if (!isQuestionPaper) return;
  parents.forEach((question) => {
    const missing = [];
    if (!nonEmpty(question.id)) missing.push("id");
    if (!nonEmpty(question.question_number)) missing.push("questionNumber");
    if (!integer(question.page_start)) missing.push("pageStart");
    if (!integer(question.page_end)) missing.push("pageEnd");
    if (missing.length) addIssue(issues, "P0", "CANONICAL_QUESTION_COVERAGE_INCOMPLETE", "questionCoverage", `Question is missing required fields: ${missing.join(", ")}.`, question);
  });
}

function checkLeafCoverage({ isQuestionPaper, parents, leaves, issues }) {
  if (!isQuestionPaper) return;
  if (!leaves.length) addIssue(issues, "P0", "CANONICAL_LEAF_COVERAGE_INCOMPLETE", "leafCoverage", "Question paper has no leaf questions.");
  const parentIds = new Set(parents.map((question) => question.id).filter(nonEmpty));
  const parentIdsWithLeaves = new Set();
  leaves.forEach((leaf) => {
    const standaloneLeaf = Number(leaf.depth) === 0 && !leaf.parent_question_id && validSectionPath(leaf.section_path_json);
    if (!nonEmpty(leaf.parent_question_id)) {
      if (!standaloneLeaf) addIssue(issues, "P0", "CANONICAL_ORPHAN_LEAF", "leafCoverage", "Leaf question has no parent reference.", leaf);
    } else if (!parentIds.has(leaf.parent_question_id)) {
      addIssue(issues, "P0", "CANONICAL_INVALID_PARENT_REFERENCE", "leafCoverage", "Leaf question references a missing parent.", leaf);
    } else {
      parentIdsWithLeaves.add(leaf.parent_question_id);
    }
    if (!validSectionPath(leaf.section_path_json)) addIssue(issues, "P0", "CANONICAL_LEAF_COVERAGE_INCOMPLETE", "leafCoverage", "Leaf question has an invalid section path.", leaf);
  });
  parents.forEach((parent) => {
    if (nonEmpty(parent.id) && !parentIdsWithLeaves.has(parent.id)) addIssue(issues, "P1", "CANONICAL_LEAF_COVERAGE_INCOMPLETE", "leafCoverage", "Parent question has no leaf question.", parent);
  });
}

function checkMarkCoverage({ isQuestionPaper, parents, leaves, entries, issues }) {
  const records = isQuestionPaper ? [...parents, ...leaves] : entries;
  if (!records.length) {
    addIssue(issues, "P0", "CANONICAL_MARK_COVERAGE_INCOMPLETE", "markCoverage", "No canonical records are available for mark coverage.");
    return;
  }
  (isQuestionPaper ? records : []).filter(requiredMarkRecord).forEach((record) => {
    if (record.marks === null || record.marks === undefined || !Number.isFinite(Number(record.marks))) {
      addIssue(issues, "P0", "CANONICAL_REQUIRED_MARK_MISSING", "markCoverage", "Required mark allocation is missing.", record);
    }
  });
  if (isQuestionPaper) {
    leaves.filter((leaf) => leaf.marks === null || leaf.marks === undefined).forEach((leaf) => {
      addIssue(issues, "P3", "CANONICAL_MARK_COVERAGE_INCOMPLETE", "markCoverage", "Leaf mark is absent under an existing staging rule that permits null marks.", leaf);
    });
    parents.forEach((parent) => {
      if (parent.raw_json?.markValidation?.valid !== true) addIssue(issues, "P0", "CANONICAL_MARK_COVERAGE_INCOMPLETE", "markCoverage", "Existing parent mark validation is not valid.", parent);
    });
  } else if (!entries.some((entry) => Number.isFinite(Number(entry.marks)))) {
    addIssue(issues, "P0", "CANONICAL_MARK_COVERAGE_INCOMPLETE", "markCoverage", "Mark scheme has no numeric mark allocation.");
  }
}

function checkResponseAreaCoverage({ isQuestionPaper, leaves, issues }) {
  if (!isQuestionPaper || !leaves.length) return;
  const required = leaves.filter((leaf) => Number(leaf.marks || 0) > 0);
  const missing = required.filter((leaf) => leaf.response_area_status !== "PRESENT" || !Array.isArray(leaf.response_areas_json) || leaf.response_areas_json.length === 0);
  missing.forEach((leaf) => addIssue(issues, "P0", "CANONICAL_RESPONSE_AREA_REQUIRED_MISSING", "responseAreaCoverage", "Required response area is missing.", leaf));
  const coverage = required.length ? (required.length - missing.length) / required.length : 1;
  if (coverage < 0.95) addIssue(issues, "P1", "CANONICAL_RESPONSE_AREA_COVERAGE_LOW", "responseAreaCoverage", `Required response-area coverage is ${(coverage * 100).toFixed(1)}%.`);
}

function checkSourceTraceCoverage({ staging, isQuestionPaper, questions, entries, pages, issues }) {
  if (!nonEmpty(staging.run?.source_file)) addIssue(issues, "P0", "CANONICAL_SOURCE_TRACE_MISSING", "sourceTraceCoverage", "Staging run has no source file.");
  const pagesByNumber = new Map(pages.map((page) => [Number(page.page_number), page]));
  if (isQuestionPaper) {
    questions.forEach((question) => {
      for (let pageNumber = Number(question.page_start); pageNumber <= Number(question.page_end); pageNumber += 1) {
        const page = pagesByNumber.get(pageNumber);
        if (!page) continue;
        if (!nonEmpty(page.display_text || page.normalized_text)) continue;
        const traces = page.source_blocks_json || [];
        if (!traces.some(hasDetailedPageTrace)) {
          addIssue(issues, "P0", "CANONICAL_SOURCE_TRACE_INVALID", "sourceTraceCoverage", `Question page ${pageNumber} has no detailed block/span source trace.`, question);
          break;
        }
      }
    });
  } else {
    entries.forEach((entry) => {
      if (!hasDetailedEntryTrace(entry.sourceTrace)) addIssue(issues, "P0", "CANONICAL_SOURCE_TRACE_INVALID", "sourceTraceCoverage", "Mark-scheme entry has no valid source trace.", { id: entry.questionId });
    });
  }
}

function checkCanonicalStructure({ questions, parents, leaves, pages, issues }) {
  duplicateIds(parents).forEach((id) => addIssue(issues, "P0", "CANONICAL_DUPLICATE_QUESTION_ID", "canonicalStructureCompleteness", `Duplicate parent question ID: ${id}.`, { id }));
  duplicateIds(leaves).forEach((id) => addIssue(issues, "P0", "CANONICAL_DUPLICATE_LEAF_ID", "canonicalStructureCompleteness", `Duplicate leaf question ID: ${id}.`, { id }));
  const allIds = new Set();
  questions.forEach((question) => {
    if (nonEmpty(question.id) && allIds.has(question.id)) addIssue(issues, "P0", question.is_leaf ? "CANONICAL_DUPLICATE_LEAF_ID" : "CANONICAL_DUPLICATE_QUESTION_ID", "canonicalStructureCompleteness", `Duplicate canonical entity ID: ${question.id}.`, question);
    if (nonEmpty(question.id)) allIds.add(question.id);
    const start = Number(question.page_start);
    const end = Number(question.page_end);
    if (!integer(question.page_start) || !integer(question.page_end) || start > end) addIssue(issues, "P0", "CANONICAL_INVALID_PAGE_RANGE", "canonicalStructureCompleteness", "Canonical entity has an invalid page range.", question);
    if (!validSectionPath(question.section_path_json)) addIssue(issues, "P0", "CANONICAL_STRUCTURE_INCONSISTENT", "canonicalStructureCompleteness", "Canonical entity has an invalid section path.", question);
  });
  const pageNumbers = new Set(pages.map((page) => Number(page.page_number)));
  questions.forEach((question) => {
    if (integer(question.page_start) && !pageNumbers.has(Number(question.page_start))) addIssue(issues, "P0", "CANONICAL_STRUCTURE_INCONSISTENT", "canonicalStructureCompleteness", "Canonical entity starts on a missing page.", question);
    if (integer(question.page_end) && !pageNumbers.has(Number(question.page_end))) addIssue(issues, "P0", "CANONICAL_STRUCTURE_INCONSISTENT", "canonicalStructureCompleteness", "Canonical entity ends on a missing page.", question);
  });
}

function responseAreaCoverage(leaves) {
  const required = leaves.filter((leaf) => Number(leaf.marks || 0) > 0);
  const present = required.filter((leaf) => leaf.response_area_status === "PRESENT" && Array.isArray(leaf.response_areas_json) && leaf.response_areas_json.length > 0);
  return { required: required.length, present: present.length, ratio: required.length ? Number((present.length / required.length).toFixed(4)) : 1 };
}

function requiredMarkRecord(record) {
  return !record.is_leaf;
}

function checkStatus(name, issues) {
  const relevant = issues.filter((issue) => issue.check === name);
  if (relevant.some((issue) => issue.severity === "P0")) return "FAIL";
  if (relevant.some((issue) => issue.severity === "P1")) return "WARN";
  return "PASS";
}

function addIssue(issues, severity, code, check, message, record = {}) {
  issues.push({ severity, code, check, message, questionId: record.id || record.questionId || null, pageNumber: record.page_number || record.pageNumber || null });
}

function duplicateIds(records) {
  const seen = new Set();
  const duplicates = new Set();
  records.forEach((record) => {
    if (!nonEmpty(record.id)) return;
    if (seen.has(record.id)) duplicates.add(record.id);
    seen.add(record.id);
  });
  return [...duplicates];
}

function hasDetailedPageTrace(trace) {
  return integer(trace.page) && integer(trace.blockIndex) && integer(trace.lineIndex) && integer(trace.spanIndex) && nonEmpty(trace.text);
}

function hasDetailedEntryTrace(trace) {
  return integer(trace?.page) && integer(trace?.blockIndex) && integer(trace?.lineIndex) && integer(trace?.spanIndex) && nonEmpty(trace?.text);
}

function validSectionPath(value) {
  return Array.isArray(value) && value.length > 0 && value.every(nonEmpty);
}

function integer(value) {
  return value !== null && value !== undefined && Number.isInteger(Number(value));
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

module.exports = { CHECK_NAMES, evaluateCanonicalCompleteness, runCanonicalCompletenessGate };
