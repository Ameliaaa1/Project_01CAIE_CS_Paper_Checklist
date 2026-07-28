const QUESTION_PAPER_PROFILE = Object.freeze({
  role: "question_paper",
  parserProfile: "QUESTION_PAPER",
  validationProfile: "QUESTION_PAPER"
});

const MARK_SCHEME_PROFILE = Object.freeze({
  role: "mark_scheme",
  parserProfile: "MARK_SCHEME",
  validationProfile: "MARK_SCHEME"
});

function documentProfileForRole(role) {
  const normalized = String(role || "").toLowerCase();
  if (normalized === "mark_scheme" || normalized === "ms") return MARK_SCHEME_PROFILE;
  if (normalized === "question_paper" || normalized === "qp") return QUESTION_PAPER_PROFILE;
  return Object.freeze({
    role: normalized || "unknown",
    parserProfile: "GENERIC_DOCUMENT",
    validationProfile: "GENERIC_DOCUMENT"
  });
}

function resolveDocumentProfile(input = {}) {
  const explicitRole = input.documentRole || input.role || null;
  const explicitProfile = documentProfileForRole(explicitRole);
  const filenameRole = roleFromFilename(input.filename || input.sourcePath);
  const textRole = roleFromText(input.text || input.displayText || input.normalizedText);
  const candidates = [
    explicitProfile.validationProfile !== "GENERIC_DOCUMENT" ? explicitProfile.role : null,
    filenameRole,
    textRole
  ].filter(Boolean);
  const unique = [...new Set(candidates)];
  const resolvedRole = candidates[0] || "unknown";
  return {
    ...documentProfileForRole(resolvedRole),
    confidence: explicitProfile.validationProfile !== "GENERIC_DOCUMENT" ? "high" : filenameRole && textRole === filenameRole ? "high" : candidates.length ? "medium" : "low",
    signals: { explicitRole: explicitProfile.validationProfile === "GENERIC_DOCUMENT" ? null : explicitProfile.role, filenameRole, textRole },
    conflict: unique.length > 1,
    diagnostics: unique.length > 1 ? ["DOCUMENT_ROLE_SIGNAL_CONFLICT"] : []
  };
}

function roleFromFilename(filename) {
  const value = String(filename || "").toLowerCase().replace(/[\s-]+/g, "_");
  if (/(?:^|_)(?:ms|mark_?scheme)(?:_|\d|\.)/.test(value)) return "mark_scheme";
  if (/(?:^|_)(?:qp|question_?paper)(?:_|\d|\.)/.test(value)) return "question_paper";
  return null;
}

function roleFromText(text) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (!value) return null;
  const markSchemeSignals = [/\bMARK SCHEME\b/i, /\bGENERIC MARKING PRINCIPLES?\b/i, /\bQuestion\s+Answer\s+Marks\b/i];
  const questionPaperSignals = [/\bREAD THESE INSTRUCTIONS FIRST\b/i, /\bAnswer all questions\b/i, /\bWrite your (?:name|centre number|candidate number)\b/i];
  const markScore = markSchemeSignals.filter((pattern) => pattern.test(value)).length;
  const questionScore = questionPaperSignals.filter((pattern) => pattern.test(value)).length;
  if (markScore > questionScore && markScore > 0) return "mark_scheme";
  if (questionScore > markScore && questionScore > 0) return "question_paper";
  return null;
}

function applyDocumentProfile(parserOutput) {
  const profile = resolveDocumentProfile({
    documentRole: parserOutput?.paper?.documentRole || parserOutput?.paper?.role,
    filename: parserOutput?.paper?.sourcePath || parserOutput?.paper?.filename,
    text: (parserOutput?.pages || []).slice(0, 2).map((page) => page.displayText || page.normalizedText || "").join(" ")
  });
  if (profile.validationProfile !== "MARK_SCHEME") {
    return {
      ...parserOutput,
      paper: {
        ...parserOutput.paper,
        parserProfile: profile.parserProfile,
        validationProfile: profile.validationProfile
      }
    };
  }

  const pages = (parserOutput.pages || []).map((page) => applyMarkSchemePageProfile(page));
  const markSchemeEntries = Array.isArray(parserOutput.markSchemeEntries) && parserOutput.markSchemeEntries.length
    ? parserOutput.markSchemeEntries
    : extractMarkSchemeEntries(pages);
  return {
    ...parserOutput,
    paper: {
      ...parserOutput.paper,
      documentRole: "mark_scheme",
      parserProfile: profile.parserProfile,
      validationProfile: profile.validationProfile
    },
    pages,
    questions: [],
    markSchemeEntries
  };
}

function applyMarkSchemePageProfile(page) {
  const regions = markSchemeContentRegions(page);
  return {
    ...page,
    pageType: markSchemePageType(page, regions),
    contentRegions: regions
  };
}

function markSchemePageType(page, regions = []) {
  if (page.pageNumber === 1) return "mark_scheme_cover";
  if (regions.some((region) => region.type === "MARKING_INSTRUCTION" || region.type === "ANNOTATION")) return "mark_scheme_instruction";
  if (regions.some((region) => region.type === "QUESTION_NUMBER" || region.type === "ANSWER" || region.type === "MARK_COLUMN")) return "mark_scheme_answers";
  if (page.containsBackMatter || regions.some((region) => region.type === "FOOTER")) return "mark_scheme_back_matter";
  return "mark_scheme_content";
}

function markSchemeContentRegions(page) {
  const items = Array.isArray(page.items) ? page.items : [];
  const regions = [];
  if (!items.length) {
    return fallbackMarkSchemeRegions(page);
  }

  const headerItems = items.filter((item) => {
    const text = String(item.text || "");
    return /MARK SCHEME|Cambridge (?:IGCSE|O Level|International AS\s*&?\s*A Level)|Paper \d|Question|Answer|Marks/i.test(text) && !isFooterItem(item);
  });
  const instructionItems = items.filter((item) => /GENERIC MARKING|MARKING PRINCIPLE|mark scheme is published|specific marking|standardisation/i.test(String(item.text || "")));
  const annotationItems = items.filter((item) => /Annotations?|Correct|Incorrect|Unclear|Benefit|Highlighter|Meaning/i.test(String(item.text || "")));
  const questionItems = items.filter((item) => isMarkSchemeQuestionNumberItem(item, page.width));
  const markItems = items.filter((item) => isMarkColumnItem(item, page.width));
  const answerItems = items.filter((item) => isMarkSchemeAnswerItem(item, page.width));
  const footerItems = items.filter(isFooterItem);

  addProfileRegion(regions, "MARK_SCHEME_HEADER", headerItems, page.height);
  addProfileRegion(regions, "MARKING_INSTRUCTION", instructionItems, page.height);
  addProfileRegion(regions, "QUESTION_NUMBER", questionItems, page.height);
  addProfileRegion(regions, "ANSWER", answerItems, page.height);
  addProfileRegion(regions, "MARK_COLUMN", markItems, page.height);
  addProfileRegion(regions, "ANNOTATION", annotationItems, page.height);
  addProfileRegion(regions, "FOOTER", footerItems, page.height);

  return regions.length ? regions : [{ type: "ANSWER", yMin: 0, yMax: Math.round(page.height || 0) }];
}

function fallbackMarkSchemeRegions(page) {
  const text = String(page.displayText || page.normalizedText || "");
  const regions = [];
  if (/MARK SCHEME|Cambridge (?:IGCSE|O Level|International AS\s*&?\s*A Level)|Paper \d/i.test(text)) regions.push(fullPageRegion("MARK_SCHEME_HEADER", page));
  if (/GENERIC MARKING|MARKING PRINCIPLE|Annotations?/i.test(text)) regions.push(fullPageRegion("MARKING_INSTRUCTION", page));
  if (/\b\d+\([a-z]\)|\bAnswer\b/i.test(text)) regions.push(fullPageRegion("ANSWER", page));
  if (/\bMarks\b/i.test(text)) regions.push(fullPageRegion("MARK_COLUMN", page));
  if (/Cambridge University Press|PUBLISHED|Page \d+ of/i.test(text)) regions.push(fullPageRegion("FOOTER", page));
  return regions.length ? regions : [fullPageRegion("ANSWER", page)];
}

function fullPageRegion(type, page) {
  return { type, yMin: 0, yMax: Math.round(page.height || 0) };
}

function addProfileRegion(regions, type, items, pageHeight) {
  if (!items.length) return;
  const yMin = pageHeight - Math.max(...items.map((item) => item.y + item.height));
  const yMax = pageHeight - Math.min(...items.map((item) => item.y));
  regions.push({
    type,
    yMin: Math.round(yMin),
    yMax: Math.round(yMax)
  });
}

function isMarkSchemeQuestionNumber(value) {
  return /^(?:\d{1,2}|\d+(?:\([a-z]\))(?:\([ivx]+\))?)$/i.test(String(value || "").trim());
}

function isMarkColumnItem(item, pageWidth = 0) {
  const text = String(item.text || "").trim();
  return /^\d{1,2}$/.test(text) && Number(item.x || 0) > Number(pageWidth || 0) * 0.72;
}

function isMarkSchemeAnswerItem(item, pageWidth = 0) {
  const text = String(item.text || "").trim();
  if (!text || item.regionType !== "content") return false;
  if (isMarkSchemeQuestionNumber(text) || isMarkColumnItem(item, pageWidth) || isFooterItem(item)) return false;
  if (/^(?:Question|Answer|Marks)$/i.test(text)) return false;
  return text.length > 1 || /[A-Za-z]/.test(text);
}

function isFooterItem(item) {
  const text = String(item.text || "");
  return item.regionType === "footer" ||
    Number(item.y || 0) < 80 ||
    /Cambridge University Press|PUBLISHED|Page \d+ of|(?:October\/November|May\/June|February\/March)\s+20\d{2}|Cambridge Assessment International Education is part of|©/i.test(text);
}

function extractMarkSchemeEntries(pages) {
  const entries = [];
  for (const page of pages || []) {
    const items = Array.isArray(page.items) ? page.items : [];
    if (page.pageNumber === 1) continue;
    const questionItems = items
      .filter((item) => isMarkSchemeQuestionNumberItem(item, page.width))
      .sort((a, b) => b.y - a.y || a.x - b.x);
    const markItems = items.filter((item) => isMarkColumnItem(item, page.width));
    for (const [index, question] of questionItems.entries()) {
      const nextQuestion = questionItems[index + 1] || null;
      const lowerBound = nextQuestion ? nextQuestion.y + 4 : -Infinity;
      const upperBound = question.y + Math.max(8, question.height + 2);
      const nearby = items
        .filter((item) => item.regionType === "content" && item.y <= upperBound && item.y > lowerBound)
        .filter((item) => item.x > question.x + 20 && item.x < Number(page.width || 0) * 0.88)
        .filter((item) => !isMarkSchemeQuestionNumberItem(item, page.width) && !isFooterItem(item));
      const answerItems = nearby.filter((item) => !isMarkColumnItem(item, page.width)).slice(0, 48);
      const markItem = markItems.find((item) => Math.abs(item.y - question.y) <= 8) || markItems.find((item) => item.y <= upperBound && item.y > lowerBound);
      const answerText = answerItems.map((item) => item.text).join(" ").trim();
      if (!answerText) continue;
      entries.push({
        questionId: String(question.text),
        answerText: [answerText],
        marks: markItem ? Number(markItem.text) : null,
        annotations: [],
        sourceTrace: sourceTraceForItem(question),
        answerSourceTrace: answerItems.map(sourceTraceForItem)
      });
    }
  }
  return entries;
}

function sourceTraceForItem(item) {
  return {
    page: item.pageNumber,
    blockIndex: item.blockIndex,
    lineIndex: item.lineIndex,
    spanIndex: item.spanIndex,
    text: item.text
  };
}

function isMarkSchemeQuestionNumberItem(item, pageWidth = 0) {
  const text = String(item.text || "").trim();
  if (!isMarkSchemeQuestionNumber(text)) return false;
  if (Number(item.x || 0) >= Number(pageWidth || 0) * 0.22) return false;
  if (/^\d$/.test(text)) {
    return Number(item.x || 0) < 110 && Number(item.lineIndex || 0) === 0 && Number(item.spanIndex || 0) === 0;
  }
  return true;
}

module.exports = {
  QUESTION_PAPER_PROFILE,
  MARK_SCHEME_PROFILE,
  applyDocumentProfile,
  documentProfileForRole,
  resolveDocumentProfile,
  roleFromFilename,
  roleFromText,
  extractMarkSchemeEntries,
  markSchemeContentRegions
};
