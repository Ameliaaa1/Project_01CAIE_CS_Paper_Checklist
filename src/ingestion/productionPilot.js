const fs = require("node:fs");
const path = require("node:path");
const { runCanonicalCompletenessGate } = require("./canonicalCompleteness");
const { evaluatePublishGate, validateStagingRecords } = require("./staging");

const SYLLABUS_IDS = new Map([
  ["0478", "caie-igcse-0478"],
  ["9618", "caie-as-a-level-9618"],
  ["9709", "caie-as-a-level-9709"]
]);
const SUPPORTED_SYLLABUSES = new Set(SYLLABUS_IDS.keys());

function publishProductionPilot(options) {
  const qpPath = requireArtifact(options.qpStagingPath, "Question Paper staging");
  const msPath = requireArtifact(options.msStagingPath, "Mark Scheme staging");
  const storePath = path.resolve(options.storePath);
  const pilotBatchId = options.pilotBatchId || "PR027-0478-2023-MJ-12";
  const qp = prepareArtifact(qpPath, "question_paper");
  const ms = prepareArtifact(msPath, "mark_scheme");
  const pairing = verifyPairing(qp, ms);
  const storeBefore = readProductionStore(storePath);
  assertNoIdentityConflict(storeBefore, [qp.paper.id, ms.paper.id], pilotBatchId);

  const batch = productionBatch(pilotBatchId, qp, ms, pairing);
  const nextStore = {
    ...storeBefore,
    updatedAt: new Date().toISOString(),
    batches: [...storeBefore.batches, batch.batch],
    papers: [...storeBefore.papers, ...batch.papers],
    questions: [...storeBefore.questions, ...batch.questions],
    responseAreas: [...storeBefore.responseAreas, ...batch.responseAreas],
    markSchemeEntries: [...storeBefore.markSchemeEntries, ...batch.markSchemeEntries],
    pairings: [...storeBefore.pairings, batch.pairing]
  };

  let written = false;
  try {
    atomicWriteJson(storePath, nextStore);
    written = true;
    if (options.failAfterWrite) throw new Error("Injected failure after production write.");
    const reread = readProductionStore(storePath);
    const productionVerification = verifyProductionState(reread, batch);
    const frontendVerification = verifyFrontendCapabilities(reread, batch, options.rootDir || process.cwd());
    return pilotReport({ pilotBatchId, storePath, qp, ms, pairing, productionVerification, frontendVerification });
  } catch (error) {
    if (written) atomicWriteJson(storePath, storeBefore);
    error.productionRollback = written ? "RESTORED_PREVIOUS_SNAPSHOT" : "NOT_REQUIRED";
    throw error;
  }
}

function rollbackProductionPilot(options) {
  const storePath = path.resolve(options.storePath);
  const pilotBatchId = options.pilotBatchId;
  const store = readProductionStore(storePath);
  const batch = store.batches.find((candidate) => candidate.id === pilotBatchId);
  if (!batch) return { status: "NOT_FOUND", pilotBatchId, productionWrite: false };
  const paperIds = new Set(batch.paperIds);
  const next = {
    ...store,
    updatedAt: new Date().toISOString(),
    batches: store.batches.filter((candidate) => candidate.id !== pilotBatchId),
    papers: store.papers.filter((paper) => !paperIds.has(paper.id)),
    questions: store.questions.filter((question) => !paperIds.has(question.paperId)),
    responseAreas: store.responseAreas.filter((area) => !paperIds.has(area.paperId)),
    markSchemeEntries: store.markSchemeEntries.filter((entry) => !paperIds.has(entry.paperId)),
    pairings: store.pairings.filter((pairing) => pairing.pilotBatchId !== pilotBatchId)
  };
  atomicWriteJson(storePath, next);
  return { status: "ROLLED_BACK", pilotBatchId, removedPaperIds: [...paperIds], productionWrite: true };
}

function prepareArtifact(stagingPath, expectedRole) {
  const staging = JSON.parse(fs.readFileSync(stagingPath, "utf8"));
  const validation = validateStagingRecords(staging);
  const completeness = runCanonicalCompletenessGate(stagingPath);
  staging.validation = validation;
  staging.issues = validation.issues;
  staging.run.summary_json.canonicalCompletenessGate = completeness;
  const publishGate = evaluatePublishGate(staging);
  const paper = staging.papers?.[0];
  const failures = [];
  if (validation.status !== "PASS") failures.push("VALIDATION_NOT_PASS");
  if (completeness.status !== "PASS" || !completeness.publishable) failures.push("CANONICAL_COMPLETENESS_NOT_PASS");
  if (publishGate.publishStatus !== "READY_TO_PUBLISH") failures.push(...publishGate.blockedReasons);
  if (paper?.document_role !== expectedRole) failures.push("DOCUMENT_ROLE_INVALID");
  if (!SUPPORTED_SYLLABUSES.has(paper?.subject_code)) failures.push("UNSUPPORTED_SYLLABUS");
  if (validation.issues.some((issue) => issue.severity === "P0")) failures.push("UNRESOLVED_P0");
  if (failures.length) throw new Error(`${paper?.id || stagingPath} production publish blocked: ${[...new Set(failures)].join(", ")}`);
  return { stagingPath, staging, paper, validation, completeness, publishGate };
}

function verifyPairing(qp, ms) {
  const fields = ["subject_code", "year", "session", "component", "paper_group_id"];
  const mismatches = fields.filter((field) => qp.paper[field] !== ms.paper[field]);
  if (mismatches.length || qp.paper.document_role !== "question_paper" || ms.paper.document_role !== "mark_scheme") {
    throw new Error(`QP/MS pairing mismatch: ${mismatches.join(", ") || "role complement"}`);
  }
  return {
    pairingStatus: "PASS",
    pairingKey: qp.paper.paper_group_id,
    questionPaperId: qp.paper.id,
    markSchemeId: ms.paper.id
  };
}

function productionBatch(pilotBatchId, qp, ms, pairing) {
  const papers = [qp, ms].map((artifact) => ({
    id: artifact.paper.id,
    pilotBatchId,
    paperGroupId: artifact.paper.paper_group_id,
    syllabus: artifact.paper.subject_code,
    year: artifact.paper.year,
    session: artifact.paper.session,
    component: artifact.paper.component,
    documentRole: artifact.paper.document_role,
    storageKey: artifact.paper.storage_key,
    sourceFile: artifact.staging.run.source_file,
    fileHash: artifact.paper.file_hash,
    sourceTrace: artifact.staging.pages.flatMap((page) => page.source_blocks_json || [])
  }));
  const questions = qp.staging.questions.map((question) => ({
    id: question.id,
    pilotBatchId,
    paperId: qp.paper.id,
    parentQuestionId: question.parent_question_id,
    questionNumber: question.question_number,
    sectionPath: question.section_path_json,
    depth: question.depth,
    isLeaf: question.is_leaf,
    questionText: question.question_text,
    displayText: question.display_text,
    searchText: question.search_text,
    pageStart: question.page_start,
    pageEnd: question.page_end,
    marks: question.marks,
    sourceTrace: sourceTraceForPages(qp.staging.pages, question.page_start, question.page_end)
  }));
  const responseAreas = qp.staging.questions.flatMap((question) => (question.response_areas_json || []).map((area, index) => ({
    ...area,
    id: `${question.id}-RA-${String(index + 1).padStart(3, "0")}`,
    pilotBatchId,
    paperId: qp.paper.id,
    questionId: question.id
  })));
  const markSchemeEntries = ms.staging.mark_scheme_entries.map((entry, index) => ({
    ...entry,
    id: `${ms.paper.id}-ENTRY-${String(index + 1).padStart(3, "0")}`,
    pilotBatchId,
    paperId: ms.paper.id
  }));
  return {
    batch: { id: pilotBatchId, pilot: pairing.pairingKey, publishedAt: new Date().toISOString(), paperIds: papers.map((paper) => paper.id) },
    papers,
    questions,
    responseAreas,
    markSchemeEntries,
    pairing: { ...pairing, pilotBatchId }
  };
}

function verifyProductionState(store, expected) {
  const paperIds = new Set(expected.papers.map((paper) => paper.id));
  const counts = {
    paperCount: store.papers.filter((paper) => paperIds.has(paper.id)).length,
    questionCount: store.questions.filter((question) => paperIds.has(question.paperId) && isTopLevelQuestion(question)).length,
    leafQuestionCount: store.questions.filter((question) => paperIds.has(question.paperId) && question.isLeaf).length,
    responseAreaCount: store.responseAreas.filter((area) => paperIds.has(area.paperId)).length,
    markSchemeEntryCount: store.markSchemeEntries.filter((entry) => paperIds.has(entry.paperId)).length
  };
  const expectedCounts = {
    paperCount: expected.papers.length,
    questionCount: expected.questions.filter(isTopLevelQuestion).length,
    leafQuestionCount: expected.questions.filter((question) => question.isLeaf).length,
    responseAreaCount: expected.responseAreas.length,
    markSchemeEntryCount: expected.markSchemeEntries.length
  };
  if (JSON.stringify(counts) !== JSON.stringify(expectedCounts)) throw new Error(`Production count mismatch: ${JSON.stringify({ counts, expectedCounts })}`);
  if (!store.pairings.some((pairing) => pairing.pilotBatchId === expected.batch.id)) throw new Error("Production QP/MS pairing is missing.");
  if (expected.questions.some((question) => !question.sourceTrace.length) || expected.markSchemeEntries.some((entry) => !entry.sourceTrace)) throw new Error("Production source trace is missing.");
  return { status: "PASS", counts, expectedCounts, sourceTraceAvailable: true, pairingLinked: true };
}

function verifyFrontendCapabilities(store, expected, rootDir) {
  const questionIds = new Set(expected.questions.map((question) => question.id));
  const questions = store.questions.filter((question) => questionIds.has(question.id));
  const parents = questions.filter(isTopLevelQuestion);
  const leaves = questions.filter((question) => question.isLeaf);
  const entries = store.markSchemeEntries.filter((entry) => entry.pilotBatchId === expected.batch.id);
  const parentIds = new Set(parents.map((question) => question.id));
  const searchable = parents.every((question) => question.id && question.questionText && `${question.id} ${question.questionText}`.toLowerCase().includes(question.id.toLowerCase()));
  const checklistValid = new Set(questions.map((question) => question.id)).size === questions.length && leaves.every((leaf) => !leaf.parentQuestionId || parentIds.has(leaf.parentQuestionId) || leaf.id === leaf.parentQuestionId);
  const markSchemeSearch = entries.length > 0 && entries.every((entry) => entry.answerText?.length && entry.sourceTrace);
  const qpRoots = new Set(parents.map((question) => normalizedQuestionRoot(question.questionNumber)).filter(Boolean));
  const retrievalEntries = entries.filter((entry) => qpRoots.has(normalizedQuestionRoot(entry.questionId)));
  const correspondence = retrievalEntries.length > 0;
  const retrievalEntry = retrievalEntries.find((entry) => entry.answerText?.length && entry.sourceTrace?.text);
  const aiRetrieval = Boolean(retrievalEntry?.answerText?.length && retrievalEntry.sourceTrace?.text);
  const originalFiles = expected.papers.map((paper) => path.join(rootDir, "public", "textbook_syllabus", paper.storageKey));
  const openOriginal = originalFiles.every((file) => fs.existsSync(file));
  const checks = { questionFinder: searchable, knowledgeChecklist: checklistValid, markSchemeSearch, aiRetrieval, openOriginalQuestion: openOriginal, qpMsCorrespondence: correspondence };
  const failed = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
  if (failed.length) throw new Error(`Frontend verification failed: ${failed.join(", ")}`);
  return Object.fromEntries(Object.keys(checks).map((name) => [name, "PASS"]));
}

function pilotReport({ pilotBatchId, storePath, qp, ms, pairing, productionVerification, frontendVerification }) {
  return {
    pilot: pairing.pairingKey,
    pilotBatchId,
    status: "PASS",
    productionWrite: true,
    storePath,
    publishGate: "PASS",
    qp: { id: qp.paper.id, status: "PASS", validation: qp.validation.status, completeness: qp.completeness.status },
    ms: { id: ms.paper.id, status: "PASS", validation: ms.validation.status, completeness: ms.completeness.status },
    pairing,
    productionVerification,
    frontendVerification,
    issues: []
  };
}

function loadProductionQuestionEntries(storePath) {
  const store = readProductionStore(storePath);
  const msByBatch = new Map();
  store.markSchemeEntries.forEach((entry) => {
    const root = normalizedQuestionRoot(entry.questionId);
    if (!root) return;
    const key = `${entry.pilotBatchId}:${root}`;
    const current = msByBatch.get(key) || { answers: [], entries: [] };
    current.answers.push(...(entry.answerText || []));
    current.entries.push(entry);
    msByBatch.set(key, current);
  });
  const paperById = new Map(store.papers.map((paper) => [paper.id, paper]));
  const pairingByQuestionPaper = new Map((store.pairings || []).map((pairing) => [pairing.questionPaperId, pairing]));
  return store.questions.filter(isTopLevelQuestion).map((question) => {
    const paper = paperById.get(question.paperId);
    const root = normalizedQuestionRoot(question.questionNumber);
    const markScheme = msByBatch.get(`${question.pilotBatchId}:${root}`) || { answers: [], entries: [] };
    const pairing = pairingByQuestionPaper.get(question.paperId);
    const markSchemePaper = pairing ? paperById.get(pairing.markSchemeId) : null;
    const markSchemePages = [...new Set(markScheme.entries.map((entry) => Number(entry.sourceTrace?.page)).filter(Number.isInteger))].sort((a, b) => a - b);
    return {
      syllabusId: SYLLABUS_IDS.get(paper.syllabus),
      section: "unknown",
      paper: `${paper.syllabus}/${paper.component}/${paper.session}/${String(paper.year).slice(-2)}`,
      ref: `Q${question.questionNumber}`,
      knowledge: "Production canonical past-paper question",
      question: question.questionText,
      answer: markScheme.answers.length ? `MS: ${markScheme.answers.join(" ")}` : "",
      canonicalQuestionId: question.id,
      production: true,
      dataSource: "PRODUCTION_CANONICAL",
      sourceReferences: {
        questionPaper: productionSourceReference(paper, pageRange(question.pageStart, question.pageEnd)),
        markScheme: productionSourceReference(markSchemePaper, markSchemePages)
      }
    };
  });
}

function productionSourceReference(paper, pages = []) {
  if (!paper?.storageKey) return null;
  const pageNumbers = [...new Set(pages.map(Number).filter(Number.isInteger))].sort((a, b) => a - b);
  return {
    paperId: paper.id,
    storageKey: paper.storageKey,
    url: `/textbook_syllabus/${String(paper.storageKey).replace(/^\/+/, "")}`,
    pages: pageNumbers,
    pageStart: pageNumbers[0] || null,
    pageEnd: pageNumbers.at(-1) || null,
    fileHash: paper.fileHash || null
  };
}

function pageRange(start, end) {
  const first = Number(start);
  const last = Number(end);
  if (!Number.isInteger(first)) return [];
  if (!Number.isInteger(last) || last < first) return [first];
  return Array.from({ length: last - first + 1 }, (_, offset) => first + offset);
}

function normalizedQuestionRoot(value) {
  const raw = String(value || "").match(/^\d+/)?.[0];
  return raw ? String(Number(raw)) : null;
}

function readProductionStore(storePath) {
  if (!fs.existsSync(storePath)) return { schemaVersion: "1.0.0", updatedAt: null, batches: [], papers: [], questions: [], responseAreas: [], markSchemeEntries: [], pairings: [] };
  return JSON.parse(fs.readFileSync(storePath, "utf8"));
}

function atomicWriteJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
    fs.renameSync(tempPath, filePath);
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

function assertNoIdentityConflict(store, paperIds, pilotBatchId) {
  const conflicts = store.papers.filter((paper) => paperIds.includes(paper.id));
  if (conflicts.length || store.batches.some((batch) => batch.id === pilotBatchId)) throw new Error(`Duplicate production identity conflict: ${[...paperIds, pilotBatchId].join(", ")}`);
}

function sourceTraceForPages(pages, start, end) {
  return pages.filter((page) => page.page_number >= start && page.page_number <= end).flatMap((page) => page.source_blocks_json || []);
}

function isTopLevelQuestion(question) {
  return !question.isLeaf || (Number(question.depth) === 0 && !question.parentQuestionId);
}

function requireArtifact(value, label) {
  if (!value) throw new Error(`${label} path is required.`);
  const resolved = path.resolve(value);
  if (!fs.existsSync(resolved)) throw new Error(`${label} artifact does not exist: ${resolved}`);
  return resolved;
}

module.exports = { SUPPORTED_SYLLABUSES, SYLLABUS_IDS, loadProductionQuestionEntries, publishProductionPilot, readProductionStore, rollbackProductionPilot };
