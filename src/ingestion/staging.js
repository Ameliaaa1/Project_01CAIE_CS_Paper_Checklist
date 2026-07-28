const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { applyDocumentProfile, documentProfileForRole } = require("./documentProfile");
const { isBackMatterText, suspiciousCharacterCount } = require("./pdfGeometry");

function buildStagingRun(parserOutput, options = {}) {
  const stagingRun = mapParserOutputToStagingRecords(applyDocumentProfile(parserOutput), options);
  const validation = validateStagingRecords(stagingRun);
  applyValidation(stagingRun, validation);
  const gate = evaluatePublishGate(stagingRun);
  stagingRun.run.publish_status = gate.publishStatus;
  stagingRun.run.status = gate.publishStatus === "READY_TO_PUBLISH" ? "READY_TO_PUBLISH" : "NEEDS_REVIEW";
  stagingRun.run.summary_json = {
    ...stagingRun.run.summary_json,
    validationStatus: validation.status,
    publishGate: gate,
    productionWrite: false,
    adminApproved: Boolean(options.adminApproved)
  };
  stagingRun.review_actions.forEach((action) => {
    if (action.action === "APPROVE_GOLDEN_FIXTURE" || action.action === "APPROVE") {
      action.after_json = { publish_status: gate.publishStatus };
    }
  });
  return stagingRun;
}

function mapParserOutputToStagingRecords(parserOutput, options = {}) {
  parserOutput = applyDocumentProfile(parserOutput);
  const documentProfile = documentProfileForRole(parserOutput.paper.documentRole);
  const runId = options.runId || stagingRunId(parserOutput.paper.id, parserOutput.paper.fileHash);
  const now = options.now || new Date().toISOString();
  const questions = parserOutput.questions || [];
  const leaves = questions.flatMap((question) => question.leafQuestions || []);
  const aggregationDiagnostics = questionAggregationDiagnostics(questions, leaves);
  const allQuestions = aggregateQuestionRecords(questions, leaves);
  const assets = stagingAssets(leaves, parserOutput.pages || [], options.assetRoot || process.cwd());

  const result = {
    run: {
      id: runId,
      source_file: parserOutput.sourceFile,
      file_hash: parserOutput.paper.fileHash,
      parser_version: parserOutput.paper.parserVersion,
      schema_version: parserOutput.paper.schemaVersion,
      status: "NEEDS_REVIEW",
      started_at: now,
      completed_at: now,
      total_pages: parserOutput.pages.length,
      total_questions: questions.length,
      total_leaf_questions: leaves.length,
      p0_issue_count: 0,
      p1_issue_count: 0,
      p2_issue_count: 0,
      publish_status: "BLOCKED",
      summary_json: {
        productionWrite: false,
        adminApproved: Boolean(options.adminApproved),
        documentProfile,
        markSchemeEntryCount: (parserOutput.markSchemeEntries || []).length,
        questionAggregationDiagnostics: aggregationDiagnostics
      }
    },
    papers: [{
      id: parserOutput.paper.id,
      ingestion_run_id: runId,
      paper_group_id: parserOutput.paper.paperGroupId,
      subject_code: parserOutput.paper.subjectCode,
      year: parserOutput.paper.year,
      session: parserOutput.paper.session,
      component: parserOutput.paper.component,
      document_role: parserOutput.paper.documentRole,
      storage_key: parserOutput.paper.storageKey,
      file_hash: parserOutput.paper.fileHash,
      parser_version: parserOutput.paper.parserVersion,
      schema_version: parserOutput.paper.schemaVersion,
      raw_json: {
        ...parserOutput.paper,
        documentProfile
      },
      validation_status: "PENDING"
    }],
    pages: parserOutput.pages.map((page) => ({
      id: `${parserOutput.paper.id}-P${String(page.pageNumber).padStart(2, "0")}`,
      ingestion_run_id: runId,
      paper_id: parserOutput.paper.id,
      page_number: page.pageNumber,
      page_type: page.pageType,
      raw_text: page.rawText || null,
      normalized_text: page.normalizedText || null,
      display_text: page.displayText || page.textPreview || null,
      requires_ocr: Boolean(page.requiresOcr),
      has_visual_content: Boolean(page.hasVisualContent),
      contains_back_matter: Boolean(page.containsBackMatter),
      content_regions_json: page.contentRegions || [],
      text_quality_json: page.textQuality || {},
      source_blocks_json: page.sourceBlocks || [],
      page_image_key: page.pageImagePath ? `staging/${page.pageImagePath}` : null,
      validation_status: "PENDING"
    })),
    questions: allQuestions.map((question) => ({
      id: question.id,
      ingestion_run_id: runId,
      paper_id: parserOutput.paper.id,
      parent_question_id: question.parentQuestionId || null,
      question_number: question.questionNumber,
      section_path_json: question.sectionPath || [question.questionNumber],
      depth: Number(question.depth || 0),
      is_leaf: Boolean(question.isLeaf),
      context_text: question.contextText || null,
      question_text: question.questionText || question.text || null,
      display_text: question.displayText || question.text || null,
      search_text: question.searchText || null,
      page_start: question.pageStart,
      page_end: question.pageEnd,
      marks: question.marks,
      bbox_json: question.bbox || null,
      has_visual_content: Boolean(question.hasVisualContent),
      visual_type: question.visualType || null,
      question_image_key: question.questionImagePath ? `staging/${question.questionImagePath}` : null,
      question_image_hash: question.questionImagePath ? assets.find((asset) => asset.record_id === question.id)?.content_hash || null : null,
      response_areas_json: (question.responseAreas || []).map((area) => ({
        ...area,
        ownerQuestionId: question.id
      })),
      response_area_status: question.responseAreaStatus || responseAreaStatusForQuestion(question),
      confidence_json: question.confidence || {},
      review_status: question.reviewStatus,
      validation_status: "PENDING",
      raw_json: question.raw_json || question
    })),
    assets,
    mark_scheme_entries: parserOutput.markSchemeEntries || [],
    issues: [],
    review_actions: options.adminApproved
      ? [{
          id: `${runId}-REVIEW-001`,
          ingestion_run_id: runId,
          record_type: "ingestion_run",
          record_id: runId,
          action: "APPROVE_GOLDEN_FIXTURE",
          approval_type: "AUTOMATED_FIXTURE_VALIDATION",
          before_json: null,
          after_json: null,
          reviewer: options.reviewer || "codex-golden-fixture",
          created_at: now
        }]
      : [],
    validation: { status: "PENDING", issues: [] }
  };
  if (options.humanApproved) {
    result.review_actions.push({
      id: `${runId}-REVIEW-${String(result.review_actions.length + 1).padStart(3, "0")}`,
      ingestion_run_id: runId,
      record_type: "ingestion_run",
      record_id: runId,
      action: "APPROVE",
      approval_type: "HUMAN_ADMIN_REVIEW",
      before_json: null,
      after_json: null,
      reviewer: options.humanReviewer || options.reviewer || "human-admin",
      created_at: now
    });
  }
  return result;
}

function applyValidation(stagingRun, validation) {
  const issueCounts = countIssues(validation.issues);
  stagingRun.run.p0_issue_count = issueCounts.P0 || 0;
  stagingRun.run.p1_issue_count = issueCounts.P1 || 0;
  stagingRun.run.p2_issue_count = issueCounts.P2 || 0;
  stagingRun.papers.forEach((paper) => {
    paper.validation_status = validation.status;
  });
  stagingRun.pages.forEach((page) => {
    page.validation_status = pageValidationStatus(page, validation.issues);
  });
  stagingRun.questions.forEach((question) => {
    question.validation_status = questionValidationStatus(question, validation.issues);
  });
  stagingRun.issues = validation.issues.map((issue, index) => ({
    id: `${stagingRun.run.id}-ISSUE-${String(index + 1).padStart(3, "0")}`,
    ingestion_run_id: stagingRun.run.id,
    paper_id: stagingRun.papers[0]?.id || null,
    question_id: issue.questionId || null,
    page_number: issue.pageNumber || null,
    severity: issue.severity,
    code: issue.code,
    message: issue.message,
    observed_json: issue.observed || null,
    expected_json: issue.expected || null,
    status: "OPEN",
    created_at: stagingRun.run.completed_at,
    resolved_at: null,
    resolution_note: null
  }));
  stagingRun.validation = validation;
}

function validateStagingRecords(stagingRun) {
  const issues = [];
  const allQuestions = stagingRun.questions || [];
  const pages = stagingRun.pages || [];
  const assets = stagingRun.assets || [];
  const profile = stagingDocumentProfile(stagingRun);
  const ids = new Set();
  const questionsById = allQuestions.reduce((groups, question) => {
    groups.set(question.id, [...(groups.get(question.id) || []), question]);
    return groups;
  }, new Map());
  const topLevelIds = new Set(allQuestions.filter((question) => !isLeafQuestion(question)).map((question) => question.id));

  if (profile.validationProfile === "QUESTION_PAPER") {
    allQuestions.forEach((question) => {
      if (ids.has(question.id)) {
        issues.push(p0("DUPLICATE_ID", `Duplicate question id: ${question.id}`, {
          ...question,
          duplicateDebug: duplicateIdDebug(question.id, questionsById.get(question.id) || [])
        }));
      }
      ids.add(question.id);
      const parentQuestionId = question.parentQuestionId || question.parent_question_id;
      if (parentQuestionId && !topLevelIds.has(parentQuestionId)) {
        issues.push(p0("MISSING_PARENT_QUESTION", `Missing parent question: ${parentQuestionId}`, question));
      }
      const pageStart = question.pageStart ?? question.page_start;
      const pageEnd = question.pageEnd ?? question.page_end;
      const displayText = question.displayText || question.display_text || question.questionText || question.question_text || "";
      const rawQuestion = question.raw_json || {};
      const responseAreas = question.responseAreas || question.response_areas_json || [];
      const responseAreaStatus = question.responseAreaStatus || question.response_area_status || responseAreaStatusForQuestion(question);
      if (pageStart > pageEnd) issues.push(p0("QUESTION_PAGE_RANGE_INVALID", "Invalid page range.", question));
      if (/binary numbers\s+and\s+are stored/i.test(displayText)) {
        issues.push(p0("MISSING_BINARY_OPERANDS", "Binary operands are missing.", question));
      }
      if (isLeafQuestion(question) && hasUnmappedTranslatorFillBlank(displayText) && responseAreas.length === 0) {
        issues.push(p0("MISSING_RESPONSE_AREAS", "Fill-in blanks are missing.", question));
      }
      if (Array.isArray(rawQuestion.responseAreas) && rawQuestion.responseAreas.length > 0 && (!Array.isArray(responseAreas) || responseAreas.length === 0)) {
        issues.push(p0("RESPONSE_AREAS_NOT_STAGED", "Parser response areas were not written to staging.", question));
      }
      if (/\[BLANK_\d+\]/.test(displayText) && (!Array.isArray(responseAreas) || responseAreas.length === 0)) {
        issues.push(p0("RESPONSE_AREAS_MISSING_FOR_BLANKS", "Blank placeholders have no staged response areas.", question));
      }
      if (isLeafQuestion(question) && responseAreaRequired(question) && (responseAreaStatus !== "PRESENT" || !Array.isArray(responseAreas) || responseAreas.length === 0)) {
        issues.push(p0("RESPONSE_AREA_MAPPING_INCOMPLETE", "Required leaf question has no mapped response area.", {
          ...question,
          responseAreaStatus,
          responseAreaDebug: responseAreaDebugForQuestion(question, allQuestions)
        }));
      }
      if (isBackMatterText(displayText)) {
        issues.push(p0("BACK_MATTER_INCLUDED", "Back matter is present in question text.", question));
      }
      if ((question.reviewStatus || question.review_status) === "AUTO_CANDIDATE" && Array.isArray(question.issues) && question.issues.some((issue) => issue.severity === "P0")) {
        issues.push(p0("AUTO_CANDIDATE_WITH_P0", "P0 issue cannot be auto-candidate.", question));
      }
      if (isLeafQuestion(question) && (question.hasVisualContent || question.has_visual_content)) {
        const asset = assets.find((candidate) => candidate.record_id === question.id);
        if (!asset || asset.status !== "generated") issues.push(p0("VISUAL_CROP_MISSING", "Visual crop is missing.", question));
      }
    });

    allQuestions.filter((question) => !isLeafQuestion(question)).forEach((question) => {
      if (question.raw_json?.markValidation && !question.raw_json.markValidation.valid) {
        issues.push(p0("MARK_SUM_MISMATCH", "Parent marks do not equal leaf marks.", question));
      }
    });
  }

  const metricMismatchPages = [];
  const suspiciousDisplayPages = [];
  const barcodePollutedPages = [];
  pages.forEach((page) => {
    const textQuality = page.textQuality || page.text_quality_json || {};
    const pageNumber = page.pageNumber || page.page_number;
    const normalizedText = page.normalizedText || page.normalized_text || "";
    const displayText = page.displayText || page.display_text || "";
    const actualNormalizedCount = suspiciousCharacterCount(normalizedText);
    const actualDisplayCount = suspiciousCharacterCount(displayText);
    const storedNormalizedCount = Number(textQuality.normalizedSuspiciousGlyphCount || 0);
    const storedDisplayCount = Number(textQuality.displaySuspiciousGlyphCount || 0);
    if (actualNormalizedCount !== storedNormalizedCount || actualDisplayCount !== storedDisplayCount) {
      metricMismatchPages.push({
        pageNumber,
        storedNormalizedCount,
        actualNormalizedCount,
        storedDisplayCount,
        actualDisplayCount
      });
    }
    if (actualDisplayCount > 0) {
      suspiciousDisplayPages.push({ pageNumber, count: actualDisplayCount });
    }
    if (hasBarcodePollution(normalizedText) || hasBarcodePollution(displayText)) {
      barcodePollutedPages.push({ pageNumber });
    }
    if ((page.pageType || page.page_type) === "mixed" && regionsOverlap(page.contentRegions || page.content_regions_json || [])) {
      issues.push(p1("MIXED_PAGE_REGION_OVERLAP", "Mixed page content regions overlap.", { pageNumber }));
    }
    if (!page.page_image_key) {
      issues.push(p1("PAGE_IMAGE_MISSING", "Review page image is missing.", { pageNumber }));
    }
  });
  if (metricMismatchPages.length) {
    issues.push(p0("TEXT_QUALITY_METRIC_INCONSISTENT", "Stored text quality metrics do not match staging text.", {
      affectedPages: metricMismatchPages.map((page) => page.pageNumber),
      metricMismatches: metricMismatchPages
    }));
  }
  if (suspiciousDisplayPages.length) {
    issues.push(p1("SUSPICIOUS_GLYPHS_REMAIN", "Suspicious glyphs remain after display text normalization.", {
      affectedPages: suspiciousDisplayPages.map((page) => page.pageNumber),
      counts: suspiciousDisplayPages
    }));
  }
  if (barcodePollutedPages.length) {
    issues.push(p0("BARCODE_TEXT_PRESENT", "Barcode, footer, or control text is present in canonical page text.", {
      affectedPages: barcodePollutedPages.map((page) => page.pageNumber)
    }));
  }
  if (profile.validationProfile === "MARK_SCHEME") {
    issues.push(...validateMarkSchemeProfile(stagingRun));
  }

  return {
    status: issues.some((issue) => issue.severity === "P0") ? "FAIL" : issues.length ? "WARN" : "PASS",
    issues
  };
}

function hasUnmappedTranslatorFillBlank(value) {
  const text = String(value || "");
  return /A compiler translates the\s+at once before\s+it\./i.test(text)
    || /An interpreter translates and executes the code\s+\./i.test(text);
}

function validateStaging(input) {
  if (input?.run && Array.isArray(input.questions)) return validateStagingRecords(input);
  const parserOutput = input.parserOutput;
  const questions = parserOutput.questions || [];
  const leaves = questions.flatMap((question) => question.leafQuestions || []);
  const allQuestions = aggregateQuestionRecords(questions, leaves);
  return validateStagingRecords({
    questions: allQuestions.map((question) => ({
      ...question,
      parent_question_id: question.parentQuestionId || null,
      page_start: question.pageStart,
      page_end: question.pageEnd,
      display_text: question.displayText || question.text || null,
      response_areas_json: question.responseAreas || [],
      response_area_status: question.responseAreaStatus || responseAreaStatusForQuestion(question),
      raw_json: question.raw_json || question
    })),
    pages: (parserOutput.pages || []).map((page) => ({
      ...page,
      page_number: page.pageNumber,
      page_type: page.pageType,
      display_text: page.displayText,
      content_regions_json: page.contentRegions || [],
      text_quality_json: page.textQuality || {},
      source_blocks_json: page.sourceBlocks || []
    })),
    assets: input.assets || []
  });
}

function validateMarkSchemeProfile(stagingRun) {
  const issues = [];
  const paper = stagingRun.papers?.[0];
  const role = String(paper?.document_role || paper?.documentRole || "").toLowerCase();
  if (role !== "mark_scheme") {
    issues.push(p0("DOCUMENT_ROLE_INVALID", "Mark Scheme profile requires document_role=mark_scheme.", paper || {}));
  }

  const regionTypes = (stagingRun.pages || []).flatMap((page) => (page.contentRegions || page.content_regions_json || []).map((region) => region.type));
  if (regionTypes.some((type) => type === "question_content" || type === "response_area" || type === "RESPONSE_AREA")) {
    issues.push(p0("MARK_SCHEME_REGION_INVALID", "Mark Scheme pages must not use Question Paper content or response-area regions.", {
      regionTypes
    }));
  }
  if (!regionTypes.some((type) => ["ANSWER", "MARK_COLUMN", "MARKING_INSTRUCTION"].includes(type))) {
    issues.push(p0("MARK_SCHEME_REGION_MISSING", "Mark Scheme regions must include answer, mark column, or marking instruction regions.", {
      regionTypes
    }));
  }

  const entries = stagingRun.mark_scheme_entries || stagingRun.run?.summary_json?.markSchemeEntries || [];
  if (!Array.isArray(entries) || entries.length === 0) {
    issues.push(p0("ANSWER_STRUCTURE_INVALID", "Mark Scheme profile requires markSchemeEntries.", {
      markSchemeEntryCount: 0
    }));
  } else {
    const malformed = entries.filter((entry) => !entry.questionId || !Array.isArray(entry.answerText) || entry.answerText.length === 0);
    if (malformed.length) {
      issues.push(p0("ANSWER_STRUCTURE_INVALID", "Mark Scheme entries require questionId and answerText.", {
        malformedEntries: malformed.slice(0, 10)
      }));
    }
    const missingMarkAllocation = entries.filter((entry) => !Number.isFinite(Number(entry.marks)));
    if (missingMarkAllocation.length === entries.length) {
      issues.push(p0("MARK_ALLOCATION_INVALID", "Mark Scheme entries require at least one numeric mark allocation.", {
        affectedEntries: missingMarkAllocation.slice(0, 10)
      }));
    }
    const missingTrace = entries.filter((entry) => !hasDetailedSourceTrace(entry.sourceTrace));
    if (missingTrace.length) {
      issues.push(p0("SOURCE_TRACE_INVALID", "Mark Scheme entries require page/block/line/span/text source trace.", {
        affectedEntries: missingTrace.slice(0, 10)
      }));
    }
  }

  const pageTraceMissing = (stagingRun.pages || []).filter((page) => {
    const blocks = page.sourceBlocks || page.source_blocks_json || [];
    return blocks.length > 0 && !blocks.some(hasDetailedSourceTrace);
  });
  if (pageTraceMissing.length) {
    issues.push(p0("SOURCE_TRACE_INVALID", "Page source traces require lineIndex, spanIndex, and text.", {
      affectedPages: pageTraceMissing.map((page) => page.page_number || page.pageNumber)
    }));
  }
  return issues;
}

function stagingAssets(leaves, pages, assetRoot) {
  const questionAssets = leaves
    .filter((leaf) => leaf.questionImagePath)
    .map((leaf) => {
      const filePath = path.join(assetRoot, "output", "ingestion-samples", leaf.questionImagePath);
      const exists = fs.existsSync(filePath);
      const content = exists ? fs.readFileSync(filePath) : null;
      return {
        id: `${leaf.id}-ASSET-QUESTION-IMAGE`,
        record_type: "staging_question",
        record_id: leaf.id,
        storage_key: `staging/${leaf.questionImagePath}`,
        status: exists && content.length > 0 ? "generated" : "missing",
        content_hash: content ? crypto.createHash("sha256").update(content).digest("hex") : null,
        byte_size: content ? content.length : 0,
        source_pages: [leaf.pageStart]
      };
    });
  const pageAssets = pages
    .filter((page) => page.pageImagePath)
    .map((page) => {
      const filePath = path.join(assetRoot, "output", "ingestion-samples", page.pageImagePath);
      const exists = fs.existsSync(filePath);
      const content = exists ? fs.readFileSync(filePath) : null;
      return {
        id: `${page.paperId || "PAGE"}-${String(page.pageNumber).padStart(3, "0")}-ASSET-PAGE-IMAGE`,
        record_type: "staging_page",
        record_id: `${String(page.pageNumber).padStart(3, "0")}`,
        storage_key: `staging/${page.pageImagePath}`,
        status: exists && content.length > 0 ? "generated" : "missing",
        content_hash: content ? crypto.createHash("sha256").update(content).digest("hex") : null,
        byte_size: content ? content.length : 0,
        source_pages: [page.pageNumber]
      };
    });
  return [...questionAssets, ...pageAssets];
}

function aggregateQuestionRecords(questions, leaves) {
  const records = [];
  questions.forEach((question) => {
    const sameIdLeaf = leaves.find((leaf) => leaf.id === question.id);
    if (sameIdLeaf) {
      records.push(mergeQuestionRecord(
        { ...question, isLeaf: true, raw_json: question },
        { ...sameIdLeaf, isLeaf: true, raw_json: sameIdLeaf }
      ));
    } else {
      records.push({ ...question, isLeaf: false, raw_json: question });
    }
  });

  leaves
    .filter((leaf) => !questions.some((question) => question.id === leaf.id))
    .forEach((leaf) => records.push({ ...leaf, isLeaf: true, raw_json: leaf }));

  return dedupeQuestionRecords(records);
}

function dedupeQuestionRecords(records) {
  const byId = new Map();
  records.forEach((record) => {
    if (!byId.has(record.id)) {
      byId.set(record.id, record);
      return;
    }
    byId.set(record.id, mergeQuestionRecord(byId.get(record.id), record));
  });
  return [...byId.values()];
}

function mergeQuestionRecord(primary, secondary) {
  const responseAreas = uniqueResponseAreas([
    ...(primary.responseAreas || primary.response_areas_json || []),
    ...(secondary.responseAreas || secondary.response_areas_json || [])
  ]);
  const rawSources = [
    ...(Array.isArray(primary.raw_json?.aggregationSources) ? primary.raw_json.aggregationSources : [compactQuestionSource(primary)]),
    ...(Array.isArray(secondary.raw_json?.aggregationSources) ? secondary.raw_json.aggregationSources : [compactQuestionSource(secondary)])
  ];
  const parentQuestionId = secondary.parentQuestionId || primary.parentQuestionId || null;
  return {
    ...primary,
    ...secondary,
    id: primary.id,
    isLeaf: Boolean(primary.isLeaf || primary.is_leaf || secondary.isLeaf || secondary.is_leaf),
    parentQuestionId: parentQuestionId === primary.id ? null : parentQuestionId,
    responseAreas,
    responseAreaStatus: responseAreas.length ? "PRESENT" : (secondary.responseAreaStatus || primary.responseAreaStatus),
    marks: Number.isFinite(Number(secondary.marks)) ? secondary.marks : primary.marks,
    raw_json: {
      ...(primary.raw_json || primary),
      aggregationSources: rawSources,
      aggregationDebug: {
        mergedDuplicateQuestionRecord: true,
        sourceCount: rawSources.length,
        responseAreasMerged: responseAreas.length
      }
    }
  };
}

function uniqueResponseAreas(areas) {
  const seen = new Set();
  return areas.filter((area) => {
    const key = [
      area.id,
      area.type,
      area.pageNumber,
      area.bbox?.xMin,
      area.bbox?.yMin,
      area.bbox?.xMax,
      area.bbox?.yMax
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function questionAggregationDiagnostics(questions, leaves) {
  const rawRecords = [
    ...questions.map((question) => ({ ...question, isLeaf: false, source: "parent_question" })),
    ...leaves.map((question) => ({ ...question, isLeaf: true, source: "leaf_question" }))
  ];
  const groups = rawRecords.reduce((map, record) => {
    map.set(record.id, [...(map.get(record.id) || []), record]);
    return map;
  }, new Map());
  return [...groups.entries()]
    .filter(([, records]) => records.length > 1)
    .map(([questionId, records]) => duplicateIdDebug(questionId, records));
}

function duplicateIdDebug(questionId, records) {
  return {
    questionId,
    instances: records.length,
    sources: records.map(compactQuestionSource)
  };
}

function compactQuestionSource(record) {
  return {
    source: record.source || (record.isLeaf || record.is_leaf ? "leaf_question" : "parent_question"),
    questionNumber: record.questionNumber || record.question_number || null,
    parentQuestionId: record.parentQuestionId || record.parent_question_id || null,
    pageStart: record.pageStart || record.page_start || null,
    pageEnd: record.pageEnd || record.page_end || null,
    marks: record.marks ?? null,
    responseAreasDetected: (record.responseAreas || record.response_areas_json || []).length,
    textSample: String(record.displayText || record.display_text || record.questionText || record.question_text || record.text || "").slice(0, 160)
  };
}

function responseAreaDebugForQuestion(question, allQuestions) {
  const rawAreas = question.raw_json?.responseAreas || [];
  const stagedAreas = question.responseAreas || question.response_areas_json || [];
  const sameQuestion = allQuestions.find((candidate) => candidate.id === question.id);
  const sourceTrace = stagedAreas.flatMap((area) => area.source ? [area.source] : []);
  return {
    questionId: question.id,
    leafQuestionExists: Boolean(sameQuestion && isLeafQuestion(sameQuestion)),
    responseAreasDetected: rawAreas.length,
    mappedResponseAreas: stagedAreas.length,
    responseAreaStatus: question.responseAreaStatus || question.response_area_status || responseAreaStatusForQuestion(question),
    sourceTrace
  };
}

function assertReadyToPublish(stagingRun) {
  const gate = evaluatePublishGate(stagingRun);
  if (gate.publishStatus !== "READY_TO_PUBLISH") throw new Error(`Staging run ${stagingRun.run.id} is not ready to publish: ${gate.blockedReasons.join(", ")}`);
  return true;
}

function evaluatePublishGate(stagingRun) {
  const checks = [];
  const profile = stagingDocumentProfile(stagingRun);
  const p0Issues = stagingRun.issues.filter((issue) => issue.severity === "P0");
  checks.push({ code: "VALIDATION_NO_P0", passed: p0Issues.length === 0 });
  checks.push({ code: "TEXT_QUALITY_METRICS_CONSISTENT", passed: !stagingRun.issues.some((issue) => issue.code === "TEXT_QUALITY_METRIC_INCONSISTENT") });
  checks.push({ code: "CANONICAL_TEXT_CLEAN", passed: !stagingRun.issues.some((issue) => issue.code === "BARCODE_TEXT_PRESENT" || issue.code === "SUSPICIOUS_GLYPHS_REMAIN") });
  checks.push({ code: "VALIDATION_PASS", passed: stagingRun.validation?.status === "PASS" || stagingRun.validation?.status === "WARN" });
  const completeness = stagingRun.run?.summary_json?.canonicalCompletenessGate;
  checks.push({ code: "CANONICAL_COMPLETENESS_GATE_PASS", passed: completeness?.status === "PASS" && completeness?.publishable === true });
  const requiredAssets = stagingRun.assets.filter((asset) => asset.record_type === "staging_question" || asset.record_type === "staging_page");
  checks.push({ code: "ASSETS_GENERATED", passed: requiredAssets.every((asset) => asset.status === "generated") });
  checks.push({ code: "PAGE_IMAGES_PRESENT", passed: stagingRun.pages.every((page) => Boolean(page.page_image_key)) });
  if (profile.validationProfile === "QUESTION_PAPER") {
    const responseAreasConsistent = stagingRun.questions.every((question) => {
      const stagedAreas = question.response_areas_json || [];
      const status = question.response_area_status || responseAreaStatusForQuestion(question);
      return !isLeafQuestion(question) || !responseAreaRequired(question) || (status === "PRESENT" && stagedAreas.length > 0);
    });
    checks.push({ code: "RESPONSE_AREA_COVERAGE_VALID", passed: responseAreasConsistent && !stagingRun.issues.some((issue) => issue.code === "RESPONSE_AREA_MAPPING_INCOMPLETE") });
  }
  if (profile.validationProfile === "MARK_SCHEME") {
    checks.push({ code: "DOCUMENT_ROLE_VALID", passed: !stagingRun.issues.some((issue) => issue.code === "DOCUMENT_ROLE_INVALID") });
    checks.push({ code: "MARK_SCHEME_REGION_VALID", passed: !stagingRun.issues.some((issue) => issue.code === "MARK_SCHEME_REGION_INVALID" || issue.code === "MARK_SCHEME_REGION_MISSING") });
    checks.push({ code: "ANSWER_STRUCTURE_VALID", passed: !stagingRun.issues.some((issue) => issue.code === "ANSWER_STRUCTURE_INVALID") });
    checks.push({ code: "MARK_ALLOCATION_VALID", passed: !stagingRun.issues.some((issue) => issue.code === "MARK_ALLOCATION_INVALID") });
    checks.push({ code: "SOURCE_TRACE_VALID", passed: !stagingRun.issues.some((issue) => issue.code === "SOURCE_TRACE_INVALID") });
  }
  const approved = stagingRun.review_actions.some((action) => {
    if (action.approval_type === "HUMAN_ADMIN_REVIEW") return true;
    if (action.action === "APPROVE" && action.approval_type !== "AUTOMATED_FIXTURE_VALIDATION") return true;
    return false;
  });
  checks.push({ code: "ADMIN_REVIEW_APPROVED", passed: approved });
  const blockedReasons = checks.filter((check) => !check.passed).map((check) => check.code);
  return {
    publishStatus: blockedReasons.length ? "BLOCKED" : "READY_TO_PUBLISH",
    checks,
    blockedReasons
  };
}

function stagingDocumentProfile(stagingRun) {
  const rawProfile = stagingRun.run?.summary_json?.documentProfile || stagingRun.papers?.[0]?.raw_json?.documentProfile;
  if (rawProfile?.validationProfile) return rawProfile;
  return documentProfileForRole(stagingRun.papers?.[0]?.document_role || stagingRun.papers?.[0]?.documentRole);
}

function hasDetailedSourceTrace(trace) {
  return trace &&
    Number.isInteger(Number(trace.page)) &&
    Number.isInteger(Number(trace.blockIndex)) &&
    Number.isInteger(Number(trace.lineIndex)) &&
    Number.isInteger(Number(trace.spanIndex)) &&
    typeof trace.text === "string" &&
    trace.text.length > 0;
}

function hasBarcodePollution(value) {
  const text = String(value || "");
  return (
    /\*\s*(?:\d\s*){8,16}\*/.test(text) ||
    /\b\d{4}\/\d{2}\/[A-Z]\/[A-Z]\/\d{2}\b/i.test(text) ||
    /\b(?:Turn over|UCLES)\b/i.test(text) ||
    /\bDO NOT WRITE IN THIS MARGIN\b/i.test(text) ||
    /[\u0000-\u001f\u007f-\u009f]/.test(text)
  );
}

function stagingRunId(paperId, fileHash) {
  return `${paperId}-RUN-${String(fileHash || "").slice(0, 12)}`;
}

function countIssues(issues) {
  return issues.reduce((counts, issue) => {
    counts[issue.severity] = (counts[issue.severity] || 0) + 1;
    return counts;
  }, {});
}

function questionValidationStatus(question, issues) {
  if (issues.some((issue) => issue.questionId === question.id && issue.severity === "P0")) return "FAIL";
  if (issues.some((issue) => issue.questionId === question.id)) return "WARN";
  return "PASS";
}

function pageValidationStatus(page, issues) {
  const pageNumber = page.pageNumber || page.page_number;
  if (issues.some((issue) => issue.pageNumber === pageNumber && issue.severity === "P0")) return "FAIL";
  if (issues.some((issue) => issue.pageNumber === pageNumber)) return "WARN";
  return "PASS";
}

function isLeafQuestion(question) {
  return Boolean(question.isLeaf ?? question.is_leaf);
}

function responseAreaRequired(question) {
  return isLeafQuestion(question) && Number(question.marks || 0) > 0;
}

function responseAreaStatusForQuestion(question) {
  const areas = question.responseAreas || question.response_areas_json || [];
  if (Array.isArray(areas) && areas.length > 0) return "PRESENT";
  if (responseAreaRequired(question)) return "MISSING";
  if (isLeafQuestion(question)) return "NOT_REQUIRED";
  return "UNKNOWN";
}

function regionsOverlap(regions) {
  const sorted = regions
    .filter((region) => typeof region.yMin === "number" || typeof region.yBottom === "number")
    .map((region) => ({
      yMin: Number(region.yMin ?? region.yBottom),
      yMax: Number(region.yMax ?? region.yTop)
    }))
    .sort((a, b) => a.yMin - b.yMin);
  return sorted.some((region, index) => index > 0 && region.yMin < sorted[index - 1].yMax);
}

function p0(code, message, record = {}) {
  return issue("P0", code, message, record);
}

function p1(code, message, record = {}) {
  return issue("P1", code, message, record);
}

function issue(severity, code, message, record = {}) {
  return {
    severity,
    code,
    message,
    questionId: record.id || null,
    pageNumber: record.pageNumber || record.page_number || null,
    observed: record
  };
}

module.exports = {
  buildStagingRun,
  mapParserOutputToStagingRecords,
  validateStaging,
  validateStagingRecords,
  evaluatePublishGate,
  assertReadyToPublish,
  stagingRunId
};
