const { displayPageText, isBackMatterText } = require("./pdfGeometry");

function sliceQuestionPaper(geometry, options = {}) {
  const maxQuestions = Number(options.maxQuestions || 30);
  const paperGroupId = stablePaperGroupId(options.paperId || options.paperGroupId || "paper");
  const markers = [];
  let missing = 0;

  for (let number = 1; number <= maxQuestions && missing < 4; number += 1) {
    const marker = findQuestionMarker(geometry.pages, number);
    if (marker) {
      markers.push({ number, ...marker });
      missing = 0;
    } else if (markers.length) {
      missing += 1;
    }
  }

  return markers
    .map((marker, index) => {
      const next = markers[index + 1] || null;
      const items = itemsBetweenMarkers(questionContentPages(geometry.pages), marker, next);
      const text = cleanQuestionText(items.map((item) => item.text).join(" "));
      const id = questionId(paperGroupId, [String(marker.number)]);
      const leafQuestions = splitLeafQuestions({
        id,
        paperGroupId,
        questionNumber: String(marker.number),
        items,
        text
      });
      const pageRange = pageRangeForItems(items, marker.pageNumber);
      const marks = estimateMarks(text, items, { expectedMarkCount: leafQuestions.length });
      const markValidation = {
        declared: marks,
        leafSum: leafQuestions.reduce((sum, leafQuestion) => sum + (leafQuestion.marks || 0), 0),
        valid: marks !== null && marks === leafQuestions.reduce((sum, leafQuestion) => sum + (leafQuestion.marks || 0), 0)
      };
      const issues = parentIssues({ text, markValidation, leafQuestions });
      const confidence = estimateQuestionConfidence({ text, marker, next, items, issues, markValidation });

      return {
        id,
        paperId: `${paperGroupId}-QP`,
        questionNumber: String(marker.number),
        sectionPath: [String(marker.number)],
        depth: 0,
        sequence: index + 1,
        pageStart: pageRange.pageStart,
        pageEnd: pageRange.pageEnd,
        isLeaf: false,
        parentQuestionId: null,
        marker: {
          pageNumber: marker.pageNumber,
          x: Math.round(marker.x),
          y: Math.round(marker.y),
          globalOrder: marker.globalOrder
        },
        marks,
        markValidation,
        hasVisualContent: leafQuestions.some((leafQuestion) => leafQuestion.hasVisualContent),
        confidence,
        issues,
        reviewStatus: reviewStatus(confidence, issues),
        leafQuestions,
        text,
        displayText: text
      };
    })
    .filter((question) => question.text.length > 20 && !isPseudocodeLineMistakenForQuestion(question.text));
}

function findQuestionMarker(pages, questionNumber) {
  const candidates = [];
  for (const page of questionContentPages(pages)) {
    const pageItems = contentItems(page.items);
    contentItems(page.items).filter((item) => {
      return topLevelQuestionNumber(item.text) === Number(questionNumber) && isQuestionMarkerCandidate(item, page, pageItems);
    }).forEach((item) => candidates.push({ pageNumber: page.pageNumber, width: page.width, height: page.height, ...item }));
  }
  if (!candidates.length) return null;
  const structural = candidates.filter((item) => /Bold/i.test(String(item.font || "")));
  return (structural.length ? structural : candidates).sort((a, b) => a.pageNumber - b.pageNumber || b.y - a.y || a.x - b.x)[0];
}

function isQuestionMarkerCandidate(item, page, pageItems = []) {
  if (item.x >= page.width * 0.11 || item.y <= 42 || item.y >= page.height - 55) return false;
  if (topLevelQuestionNumber(item.text) === null) return false;
  if (isPseudocodeLineNumber(item, pageItems)) return false;
  return true;
}

function topLevelQuestionNumber(value) {
  const match = String(value || "").trim().match(/^(?:Q(?:uestion)?\s*)?(\d{1,2})(?=\s*$|\s*\([a-z]\))/i);
  return match ? Number(match[1]) : null;
}

function parseQuestionReference(value) {
  const match = String(value || "").trim().match(/^(?:Q(?:uestion)?\s*)?(\d{1,2})(?:\s*\(([a-z])\))?(?:\s*\(([ivx]+)\))?$/i);
  if (!match) return null;
  const sectionPath = [match[1], match[2], match[3]].filter(Boolean).map((part, index) => index ? part.toLowerCase() : part);
  return { topLevel: Number(match[1]), sectionPath, normalized: questionNumberFromPath(sectionPath), depth: sectionPath.length - 1 };
}

function isPseudocodeLineNumber(item, pageItems) {
  const lineItems = sameSourceLineItems(item, pageItems);
  const lineText = lineItems.map((lineItem) => lineItem.text).join(" ").trim();
  const font = String(item.font || "");
  if (!lineText || lineText === String(item.text)) return false;
  if (!/Courier|Mono|Code/i.test(font)) return false;
  return new RegExp(`^${escapeRegExp(String(item.text))}\\s+${pseudocodeLineStarterPattern().source}`, "i").test(lineText);
}

function sameSourceLineItems(item, pageItems) {
  if (item.blockIndex === undefined || item.lineIndex === undefined) return [item];
  return pageItems
    .filter((candidate) => candidate.blockIndex === item.blockIndex && candidate.lineIndex === item.lineIndex)
    .sort((a, b) => a.x - b.x || (a.globalOrder || 0) - (b.globalOrder || 0));
}

function pseudocodeLineStarterPattern() {
  return /(?:DECLARE|CONSTANT|ELSE|ENDIF|END\s*IF|WHILE|ENDWHILE|END\s*WHILE|IF|THEN|FOR|NEXT|RETURN|INPUT|OUTPUT|CASE|ENDCASE|PROCEDURE|FUNCTION|[A-Za-z_][A-Za-z0-9_]*(?:\s*(?:←|<-|=|\(|\[)))/;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function questionMarkerDiagnostics(pages, options = {}) {
  const maxQuestions = Number(options.maxQuestions || 30);
  return questionContentPages(pages).flatMap((page) => {
    const pageItems = contentItems(page.items);
    return pageItems
      .filter((item) => topLevelQuestionNumber(item.text) !== null && item.x < page.width * 0.11 && item.y > 42 && item.y < page.height - 55)
      .map((item) => {
        const number = topLevelQuestionNumber(item.text);
        const accepted = number >= 1 && number <= maxQuestions && isQuestionMarkerCandidate(item, page, pageItems);
        const lineText = sameSourceLineItems(item, pageItems).map((lineItem) => lineItem.text).join(" ").trim();
        return {
          token: item.text,
          pageNumber: page.pageNumber,
          x: Math.round(item.x),
          y: Math.round(item.y),
          font: item.font || null,
          size: item.size || null,
          blockIndex: item.blockIndex ?? null,
          lineIndex: item.lineIndex ?? null,
          spanIndex: item.spanIndex ?? null,
          sourceLine: lineText || item.text,
          detectedAs: accepted ? "question_marker" : "numeric_content",
          decision: accepted ? "accepted" : "rejected",
          reason: accepted ? "layout_context_valid" : markerRejectionReason(item, page, pageItems)
        };
      });
  }).sort((a, b) => a.pageNumber - b.pageNumber || b.y - a.y || a.x - b.x);
}

function markerRejectionReason(item, page, pageItems) {
  if (item.x >= page.width * 0.11 || item.y <= 42 || item.y >= page.height - 55) return "outside_question_marker_band";
  if (isPseudocodeLineNumber(item, pageItems)) return "pseudocode_or_numeric_content_line";
  return "not_expected_question_sequence_marker";
}

function itemsBetweenMarkers(pages, start, end) {
  const output = [];
  const sameLinePartMarker = pages
    .filter((page) => page.pageNumber === start.pageNumber)
    .flatMap((page) => contentItems(page.items))
    .filter((item) => /^\([a-h]\)$/i.test(String(item.text || "")))
    .filter((item) => Number(item.x) > Number(start.x) && Math.abs(Number(item.y) - Number(start.y)) <= 20)
    .sort((a, b) => a.globalOrder - b.globalOrder)[0];
  const startOrder = Math.min(start.globalOrder, sameLinePartMarker?.globalOrder ?? start.globalOrder);
  pages.forEach((page) => {
    if (page.pageNumber < start.pageNumber || (end && page.pageNumber > end.pageNumber)) return;
    contentItems(page.items)
      .map((item) => ({ pageNumber: page.pageNumber, pageWidth: page.width, pageHeight: page.height, ...item }))
      .filter((item) => item.globalOrder >= startOrder && (!end || item.globalOrder < end.globalOrder))
      .forEach((item) => output.push(item));
  });
  return output.sort((a, b) => a.globalOrder - b.globalOrder);
}

function questionContentPages(pages) {
  return pages.filter((page) => ["question_content", "mixed", "unknown"].includes(page.pageType));
}

function contentItems(items) {
  return items.filter((item) => item.regionType === "content" || item.regionType === "answer_line");
}

function splitLeafQuestions(question) {
  const topLevelNumber = question.questionNumber;
  const partMarkers = markerItems(question.items, /^\(([a-h])\)$/i);
  if (!partMarkers.length) {
    return [leafQuestion({
      paperGroupId: question.paperGroupId,
      parentQuestionId: question.id,
      sectionPath: [topLevelNumber],
      depth: 0,
      items: question.items,
      contextItems: [],
      visual: visualInfo(topLevelNumber, question.items, question.paperGroupId)
    })];
  }

  const topStemItems = question.items.filter((item) => item.globalOrder > question.items[0].globalOrder && item.globalOrder < partMarkers[0].globalOrder);
  const partLeaves = partMarkers.flatMap((partMarker, partIndex) => {
    const nextPart = partMarkers[partIndex + 1] || null;
    const partItems = question.items.filter((item) =>
      item.globalOrder >= partMarker.globalOrder && (!nextPart || item.globalOrder < nextPart.globalOrder)
    );
    const subMarkers = markerItems(partItems, /^\(([ivx]+)\)$/i).filter((item) => isRomanNumeral(item.markerLabel));
    const partLabel = partMarker.markerLabel;
    const partStemItems = subMarkers.length
      ? partItems.filter((item) => item.globalOrder > partMarker.globalOrder && item.globalOrder < subMarkers[0].globalOrder)
      : [];

    if (!subMarkers.length) {
      const sectionPath = [topLevelNumber, partLabel];
      return [leafQuestion({
        paperGroupId: question.paperGroupId,
        parentQuestionId: question.id,
        sectionPath,
        depth: 1,
        items: partItems,
        contextItems: topStemItems,
        visual: visualInfo(sectionPath.join(""), partItems, question.paperGroupId)
      })];
    }

    const subLeaves = subMarkers.map((subMarker, subIndex) => {
      const nextSub = subMarkers[subIndex + 1] || nextPart;
      const subItems = partItems.filter((item) =>
        item.globalOrder >= subMarker.globalOrder && (!nextSub || item.globalOrder < nextSub.globalOrder)
      );
      const sectionPath = [topLevelNumber, partLabel, subMarker.markerLabel];
      return leafQuestion({
        paperGroupId: question.paperGroupId,
        parentQuestionId: question.id,
        sectionPath,
        depth: 2,
        items: subItems,
        contextItems: [...topStemItems, ...partStemItems],
        visual: visualInfo(sectionPath.join(""), [...partStemItems, ...subItems], question.paperGroupId)
      });
    });
    const partStemMarks = estimateMarks(
      cleanQuestionText(partStemItems.map((item) => item.text).join(" ")),
      partStemItems,
      { expectedMarkCount: 1 }
    );
    if (!partStemMarks) return subLeaves;
    const sectionPath = [topLevelNumber, partLabel];
    return [leafQuestion({
      paperGroupId: question.paperGroupId,
      parentQuestionId: question.id,
      sectionPath,
      depth: 1,
      items: partStemItems,
      contextItems: topStemItems,
      visual: visualInfo(sectionPath.join(""), partStemItems, question.paperGroupId)
    }), ...subLeaves];
  });
  const topStemMarks = estimateMarks(cleanQuestionText(topStemItems.map((item) => item.text).join(" ")), topStemItems, { expectedMarkCount: 1 });
  const partMarkSum = partLeaves.reduce((sum, leaf) => sum + (leaf.marks || 0), 0);
  const parentMarks = estimateMarks(question.text, question.items, { expectedMarkCount: partLeaves.length + 1 });
  if (topStemMarks && parentMarks === partMarkSum + topStemMarks) {
    return [leafQuestion({
      paperGroupId: question.paperGroupId,
      parentQuestionId: question.id,
      sectionPath: [topLevelNumber, "stem"],
      depth: 1,
      items: topStemItems,
      contextItems: [],
      visual: visualInfo(topLevelNumber, topStemItems, question.paperGroupId)
    }), ...partLeaves];
  }
  return partLeaves;
}

function leafQuestion({ paperGroupId, parentQuestionId, sectionPath, depth, items, contextItems, visual }) {
  const pageRange = pageRangeForItems(items, null);
  const contextText = cleanQuestionText(contextItems.map((item) => item.text).join(" "));
  const fillBlank = looksLikeFillBlank(items.map((item) => item.text).join(" "));
  const questionText = cleanQuestionText(items.map((item) => item.text).join(" "), { preserveResponseAreas: fillBlank });
  const displayText = [contextText, questionText].filter(Boolean).join("\n");
  const marks = estimateMarks(questionText, items, { expectedMarkCount: 1 });
  const responseAreas = responseAreasForItems(items, { marks, visual });
  const responseAreaStatus = responseAreaStatusForLeaf({ marks, responseAreas });
  const issues = leafIssues({ items, contextText, questionText, visual, responseAreas });
  const confidence = estimateLeafConfidence({ items, contextText, questionText, issues, visual });

  return {
    id: questionId(paperGroupId, sectionPath),
    paperId: `${paperGroupId}-QP`,
    parentQuestionId,
    questionNumber: questionNumberFromPath(sectionPath),
    sectionPath,
    depth,
    isLeaf: true,
    contextText,
    questionText,
    displayText,
    searchText: searchText(displayText),
    pageStart: pageRange.pageStart,
    pageEnd: pageRange.pageEnd,
    marks,
    responseAreas,
    responseAreaStatus,
    hasVisualContent: visual.hasVisualContent,
    visualType: visual.visualType,
    questionImagePath: visual.questionImagePath,
    bbox: boundingBox(items),
    confidence,
    issues,
    reviewStatus: reviewStatus(confidence, issues)
  };
}

function markerItems(items, regex) {
  return items
    .map((item) => {
      const match = String(item.text || "").match(regex);
      return match ? { ...item, markerLabel: match[1].toLowerCase() } : null;
    })
    .filter((item) => item && isStructuralLeafMarker(item))
    .sort((a, b) => a.globalOrder - b.globalOrder);
}

function isStructuralLeafMarker(item) {
  if (!Number.isFinite(Number(item.x)) || !Number.isFinite(Number(item.pageWidth))) return true;
  return Number(item.x) < Number(item.pageWidth) * 0.24;
}

function pageRangeForItems(items, fallback) {
  const usable = items.filter((item) => item.regionType === "content");
  if (!usable.length && fallback) return { pageStart: fallback, pageEnd: fallback };
  return {
    pageStart: Math.min(...usable.map((item) => item.pageNumber)),
    pageEnd: Math.max(...usable.map((item) => item.pageNumber))
  };
}

function estimateMarks(text, items = [], options = {}) {
  const layoutMarks = items
    .filter((item) => /^\[\d{1,2}\]$/.test(String(item.text || "")))
    .filter((item) => Number.isFinite(Number(item.x)) && Number.isFinite(Number(item.pageWidth)))
    .filter((item) => Number(item.x) >= Number(item.pageWidth) * 0.82)
    .map((item) => Number(String(item.text).slice(1, -1)));
  if (layoutMarks.length && layoutMarks.length === Number(options.expectedMarkCount || 0)) {
    return layoutMarks.reduce((total, value) => total + value, 0);
  }
  const matches = markTokens(String(text || "")).map((token) => token.value);
  if (!matches.length) return null;
  return matches.reduce((total, value) => total + value, 0);
}

function markTokens(text) {
  const tokens = [...String(text || "").matchAll(/\[(\d{1,2})\]/g)].map((match) => ({
    value: Number(match[1]),
    index: match.index,
    raw: match[0]
  }));
  return tokens.filter((token, index) => !isArrayIndexToken(text, token, tokens, index));
}

function isArrayIndexToken(text, token, tokens, index) {
  const previous = tokens[index - 1] || null;
  const next = tokens[index + 1] || null;
  const before = text.slice(Math.max(0, token.index - 45), token.index);
  const after = text.slice(token.index + token.raw.length, Math.min(text.length, token.index + token.raw.length + 45));
  const window = text.slice(Math.max(0, token.index - 90), Math.min(text.length, token.index + token.raw.length + 90));
  if (/\b(?:Index|Array|Data|Pointer|MyData|ArrayNodes|Temperatures|Number)\s*$/i.test(before)) return true;
  if (token.value <= 2 && /\bIndex\s+\[0\]\s+\[1\]\s+\[2\]/i.test(window)) return true;
  if (previous && token.index - (previous.index + previous.raw.length) <= 3 && token.value === previous.value + 1) return true;
  if (next && next.index - (token.index + token.raw.length) <= 3 && next.value === token.value + 1) return true;
  if (/\]\s*(?:-?\d+|[A-Za-z])/.test(after) && /\[[0-9]{1,2}\](?:\s+\[[0-9]{1,2}\]){1,}/.test(`${token.raw}${after}`)) return true;
  return false;
}

function estimateQuestionConfidence({ text, marker, next, items, issues, markValidation }) {
  const hasP0 = issues.some((issue) => issue.severity === "P0");
  const breakdown = {
    marker: marker ? 0.98 : 0.2,
    boundary: items.length ? 0.96 : 0.35,
    text: text.length >= 160 && !hasCorruptPdfText(text) ? 0.96 : text.length >= 80 ? 0.72 : 0.35,
    marks: markValidation.valid ? 0.99 : 0.35,
    layout: items.length >= 8 ? 0.92 : 0.45,
    structure: hasP0 ? 0.35 : 0.96
  };
  if (!next) breakdown.boundary = Math.min(breakdown.boundary, 0.88);
  return withOverall(breakdown);
}

function estimateLeafConfidence({ items, contextText, questionText, issues, visual }) {
  const hasP0 = issues.some((issue) => issue.severity === "P0");
  const breakdown = {
    marker: items[0] ? 0.98 : 0.25,
    boundary: items.length ? 0.98 : 0.35,
    text: questionText.length >= 20 && !hasCorruptPdfText(questionText) ? 0.97 : 0.45,
    marks: /\[\d{1,2}\]/.test(questionText) ? 0.99 : 0.5,
    layout: visual.hasVisualContent && !visual.questionImagePath ? 0.55 : 0.95,
    structure: hasP0 ? 0.35 : 0.98
  };
  if (needsContext(questionText) && !contextText) breakdown.text = Math.min(breakdown.text, 0.55);
  return withOverall(breakdown);
}

function withOverall(breakdown) {
  const overall = Number((
    breakdown.marker * 0.18 +
    breakdown.boundary * 0.2 +
    breakdown.text * 0.2 +
    breakdown.marks * 0.18 +
    breakdown.layout * 0.12 +
    breakdown.structure * 0.12
  ).toFixed(2));
  return { ...breakdown, overall: breakdown.structure <= 0.35 ? Math.min(overall, 0.69) : overall };
}

function parentIssues({ text, markValidation, leafQuestions }) {
  const issues = [];
  if (!markValidation.valid) issues.push(issue("P0", "MARK_SUM_MISMATCH", "Parent marks do not equal leaf marks."));
  if (hasCorruptPdfText(text)) issues.push(issue("P0", "SUSPICIOUS_GLYPHS", "Question text contains suspicious PDF glyphs."));
  if (isBackMatterText(text)) issues.push(issue("P0", "BACK_MATTER_INCLUDED", "Question text includes copyright back matter."));
  if (leafQuestions.some((leaf) => leaf.reviewStatus === "BLOCKED")) {
    issues.push(issue("P0", "LEAF_VALIDATION_FAILED", "At least one leaf question is blocked."));
  }
  return issues;
}

function leafIssues({ items, contextText, questionText, visual, responseAreas = [] }) {
  const issues = [];
  if (!items.length) issues.push(issue("P0", "QUESTION_PAGE_RANGE_INVALID", "Leaf question has no assigned text blocks."));
  if (needsContext(questionText) && !contextText) issues.push(issue("P0", "MISSING_PARENT_CONTEXT", "Leaf question requires parent context."));
  if (hasCorruptPdfText(questionText) || hasCorruptPdfText(contextText)) issues.push(issue("P0", "SUSPICIOUS_GLYPHS", "Leaf text contains suspicious PDF glyphs."));
  if (isBackMatterText(questionText)) issues.push(issue("P0", "BACK_MATTER_INCLUDED", "Leaf text includes copyright back matter."));
  if (visual.hasVisualContent && !visual.questionImagePath) issues.push(issue("P0", "VISUAL_CROP_MISSING", "Visual question is missing a crop path."));
  if (looksLikeFillBlank(questionText) && !questionText.includes("[BLANK_") && responseAreas.length === 0) issues.push(issue("P0", "MISSING_RESPONSE_AREAS", "Fill-in question is missing response area markers."));
  if (/binary numbers\s+and\s+are stored/i.test(questionText)) issues.push(issue("P0", "MISSING_BINARY_OPERANDS", "Binary operands are missing from question text."));
  return issues;
}

function issue(severity, code, message) {
  return { severity, code, message };
}

function reviewStatus(confidence, issues) {
  if (issues.some((issueItem) => issueItem.severity === "P0")) return "BLOCKED";
  if (confidence.overall >= 0.9) return "AUTO_CANDIDATE";
  if (confidence.overall >= 0.75) return "NEEDS_REVIEW";
  return "BLOCKED";
}

function cleanQuestionText(value, options = {}) {
  let blankIndex = 0;
  const protectedValue = options.preserveResponseAreas
    ? String(value || "").replace(/\.{6,}/g, () => ` __PAPERLENS_BLANK_${blankIndex += 1}__ `)
    : String(value || "");
  return displayPageText(protectedValue)
    .replace(/\bCambridge Assessment International Education is part of Cambridge Assessment[\s\S]*$/gi, " ")
    .replace(/\bWorking space\b/gi, " ")
    .replace(/__PAPERLENS_BLANK_(\d+)__/g, "[BLANK_$1]")
    .replace(/\s+/g, " ")
    .trim();
}

function hasCorruptPdfText(value) {
  const suspicious = String(value || "").match(/[ĬĀĂĄĈĊČĎĐĒĔĖĘĚĜĞĠĢĤĦĨĪĬÎÏÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïú¾´õùûþ¸¶¬¦¤ªºµ·¿À-ÖØ-Þ]/g) || [];
  return suspicious.length > 0;
}

function isPseudocodeLineMistakenForQuestion(text) {
  const value = String(text || "").trim();
  if (/\([a-z]\)|\([ivx]{1,5}\)|\[\d+\]/i.test(value)) return false;
  return /^\d+\s+(?:DECLARE|CONSTANT|ELSE|ENDIF|END\s*IF|WHILE|ENDWHILE|END\s*WHILE|IF|FOR|NEXT|RETURN|INPUT|OUTPUT|CASE|ENDCASE|PROCEDURE|FUNCTION)\b/i.test(value);
}

function questionId(paperGroupId, sectionPath) {
  const prefix = stablePaperGroupId(paperGroupId);
  const path = Array.isArray(sectionPath) ? sectionPath : String(sectionPath || "").split(/[().-]+/).filter(Boolean);
  const suffix = path.map((part, index) => index === 0 ? String(part).toUpperCase() : String(part).toUpperCase()).join("-");
  return `${prefix}-Q${suffix.replace(/^Q/i, "")}`;
}

function stablePaperGroupId(value) {
  const text = String(value || "paper");
  const caie = text.match(/^(\d{4})[_-]([msw])[_-](\d{2})[_-](\d{2})$/i);
  if (caie) {
    const [, subject, sessionCode, year, component] = caie;
    const session = { m: "FM", s: "MJ", w: "ON" }[sessionCode.toLowerCase()] || sessionCode.toUpperCase();
    return `${subject}-20${year}-${session}-${component}`;
  }
  return text.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toUpperCase();
}

function questionNumberFromPath(sectionPath) {
  return sectionPath.reduce((value, part, index) => {
    if (index === 0) return String(part);
    return `${value}(${part})`;
  }, "");
}

function searchText(value) {
  return String(value || "")
    .replace(/[–—−]/g, "-")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function boundingBox(items) {
  if (!items.length) return null;
  return {
    pageStart: Math.min(...items.map((item) => item.pageNumber)),
    pageEnd: Math.max(...items.map((item) => item.pageNumber)),
    xMin: Math.round(Math.min(...items.map((item) => item.x))),
    yMin: Math.round(Math.min(...items.map((item) => item.y))),
    xMax: Math.round(Math.max(...items.map((item) => item.x + item.width))),
    yMax: Math.round(Math.max(...items.map((item) => item.y + item.height)))
  };
}

function visualInfo(pathKey, items, paperGroupId = "paper") {
  const text = cleanQuestionText(items.map((item) => item.text).join(" "));
  const normalized = String(pathKey || "").toLowerCase();
  let visualType = null;
  if (/\btick\b|one box/i.test(text)) visualType = "tick_box";
  if (/\bcomplete the table\b|\btable\b/i.test(text)) visualType = "table";
  if (/\bdiagram\b|annotate/i.test(text)) visualType = "diagram";
  const structuralSignal = items.some((item) => item.regionType === "answer_line") || items.filter((item) => String(item.text || "").length <= 4).length >= 4;
  const hasVisual = Boolean(visualType) && structuralSignal;
  return {
    hasVisualContent: hasVisual,
    visualType: hasVisual ? visualType : null,
    questionImagePath: hasVisual ? `rendered/${stablePaperGroupId(paperGroupId)}-QP/${cropNameFromSectionPath(pathKeyToSectionPath(pathKey))}.webp` : null
  };
}

function pathKeyToSectionPath(pathKey) {
  const match = String(pathKey || "").match(/^(\d+)([a-h])?([ivx]+)?$/i);
  return match ? [match[1], match[2], match[3]].filter(Boolean).map((item) => item.toLowerCase()) : [String(pathKey || "question")];
}

function cropNameFromSectionPath(sectionPath) {
  return `Q${sectionPath.map((item) => String(item).toUpperCase()).join("-")}`;
}

function needsContext(questionText) {
  return /\b(size|number|method|choice|answer|this|the image file|the programmer|the hospital|secure connection)\b/i.test(questionText);
}

function responseAreasForItems(items, options = {}) {
  const visual = options.visual || {};
  if (looksLikeFillBlank(items.map((item) => item.text).join(" "))) {
    const inlineBlankAreas = inlineBlankAreasForItems(items);
    if (inlineBlankAreas.length) return inlineBlankAreas;
  }
  const answerLineAreas = answerLineAreasForItems(items);
  if (answerLineAreas.length) return answerLineAreas;
  const layoutArea = layoutResponseAreaForItems(items, { marks: options.marks, visual });
  if (layoutArea) return [layoutArea];
  if (visual.hasVisualContent) {
    const bbox = boundingBox(items);
    return bbox ? [{
      id: "visual-response-1",
      type: visual.visualType === "tick_box" ? "choice_area" : "visual_response_area",
      pageNumber: bbox.pageStart,
      marks: estimateMarks(items.map((item) => item.text).join(" ")),
      bbox: {
        xMin: bbox.xMin,
        yMin: bbox.yMin,
        xMax: bbox.xMax,
        yMax: bbox.yMax
      }
    }] : [];
  }
  if (looksLikeStructuredResponse(items)) {
    const bbox = boundingBox(items);
    return bbox ? [{
      id: "structured-response-1",
      type: "structured_response_area",
      pageNumber: bbox.pageStart,
      marks: estimateMarks(items.map((item) => item.text).join(" ")),
      bbox: {
        xMin: bbox.xMin,
        yMin: bbox.yMin,
        xMax: bbox.xMax,
        yMax: bbox.yMax
      }
    }] : [];
  }
  const inferredArea = inferredResponseAreaForItems(items, { marks: options.marks });
  if (inferredArea) return [inferredArea];
  return [];
}

function layoutResponseAreaForItems(items, options = {}) {
  const text = cleanQuestionText(items.map((item) => item.text).join(" "));
  const bbox = boundingBox(items);
  if (!bbox) return null;
  const marks = Number(options.marks || estimateMarks(text) || 0) || null;
  const legacyMultipleChoice = /\bone\b[\s\S]*\bA\b[\s\S]*\bB\b[\s\S]*\bC\b[\s\S]*\bD\b[\s\S]*\[1\]/.test(text);
  if (/\btick\b|one box|circle/i.test(text) || legacyMultipleChoice) {
    return responseAreaFromBbox("choice-area-1", "choice_area", bbox, marks, {
      detection: "layout_keyword",
      keywords: matchingKeywords(text, [/\btick\b/i, /one box/i, /circle/i, /\bone\b[\s\S]*\bA\b[\s\S]*\bB\b[\s\S]*\bC\b[\s\S]*\bD\b[\s\S]*\[1\]/])
    });
  }
  if (/\bcomplete the table\b|\btable\b/i.test(text)) {
    return responseAreaFromBbox("table-response-1", "structured_response_area", bbox, marks, {
      detection: "layout_keyword",
      keywords: matchingKeywords(text, [/\bcomplete the table\b/i, /\btable\b/i])
    });
  }
  if (/\bdraw\b|\bdiagram\b|annotate/i.test(text)) {
    return responseAreaFromBbox("visual-response-1", "visual_response_area", bbox, marks, {
      detection: "layout_keyword",
      keywords: matchingKeywords(text, [/\bdraw\b/i, /\bdiagram\b/i, /annotate/i])
    });
  }
  return null;
}

function classifyResponseLayout(text, options = {}) {
  const value = cleanQuestionText(text);
  if (options.hasAnswerLines || /\.{6,}/.test(String(text || ""))) return "answer_line";
  if (/\btick\b|one box|\bcircle\b/i.test(value)) return "choice_area";
  if (/\bcomplete (?:the|this) table\b|\btable\b/i.test(value)) return "structured_table";
  if (/\b(?:draw|sketch|plot|annotate|shade)\b|\bdiagram\b|\bgraph\b/i.test(value)) return "visual_response_area";
  if (/\bshow (?:all )?your working\b|\bworking space\b/i.test(value)) return "structured_response_area";
  return "text_response_area";
}

function inferredResponseAreaForItems(items, options = {}) {
  const marks = Number(options.marks || estimateMarks(items.map((item) => item.text).join(" ")) || 0);
  if (!marks || marks <= 0) return null;
  const bbox = boundingBox(items);
  if (!bbox) return null;
  return responseAreaFromBbox("inferred-response-1", "inferred_text_response_area", bbox, marks, {
    detection: "inferred_from_leaf_bounds",
    confidence: "low",
    note: "No explicit answer-line or layout response area was visible in PDF text geometry."
  });
}

function responseAreaFromBbox(id, type, bbox, marks, source) {
  return {
    id,
    type,
    pageNumber: bbox.pageStart,
    marks,
    bbox: {
      xMin: bbox.xMin,
      yMin: bbox.yMin,
      xMax: bbox.xMax,
      yMax: bbox.yMax
    },
    source
  };
}

function matchingKeywords(text, regexes) {
  return regexes.filter((regex) => regex.test(text)).map((regex) => regex.source.replace(/\\b|\\/g, ""));
}

function inlineBlankAreasForItems(items) {
  let index = 0;
  return items.flatMap((item) => {
    const matches = [...String(item.text || "").matchAll(/\.{6,}/g)];
    return matches.map(() => {
      index += 1;
      return {
        id: `blank-${index}`,
        type: "inline_blank",
        pageNumber: item.pageNumber,
        bbox: {
          xMin: Math.round(item.x),
          yMin: Math.round(item.y),
          xMax: Math.round(item.x + item.width),
          yMax: Math.round(item.y + item.height)
        }
      };
    });
  });
}

function answerLineAreasForItems(items) {
  let index = 0;
  return items
    .filter((item) => item.regionType === "answer_line")
    .map((item) => {
      index += 1;
      return {
        id: `answer-line-${index}`,
        type: "answer_line",
        marks: nearestMarksForItem(item, items),
        pageNumber: item.pageNumber,
        bbox: {
          xMin: Math.round(item.x),
          yMin: Math.round(item.y),
          xMax: Math.round(item.x + item.width),
          yMax: Math.round(item.y + item.height)
        },
        source: {
          pageNumber: item.pageNumber,
          blockIndex: item.blockIndex ?? null,
          lineIndex: item.lineIndex ?? null,
          spanIndex: item.spanIndex ?? null,
          includedText: item.text
        }
      };
    });
}

function nearestMarksForItem(item, items) {
  const markItems = items
    .filter((candidate) => candidate.pageNumber === item.pageNumber && /^\[\d{1,2}\]$/.test(candidate.text || ""))
    .map((candidate) => ({
      marks: Number(String(candidate.text).replace(/\D/g, "")),
      distance: Math.abs((candidate.globalOrder || 0) - (item.globalOrder || 0))
    }))
    .sort((a, b) => a.distance - b.distance);
  return markItems[0]?.marks || null;
}

function responseAreaStatusForLeaf({ marks, responseAreas }) {
  if (Array.isArray(responseAreas) && responseAreas.length > 0) return "PRESENT";
  if (marks && marks > 0) return "MISSING";
  return "NOT_REQUIRED";
}

function looksLikeStructuredResponse(items) {
  const text = items.map((item) => item.text).join(" ");
  return /\badd the two binary numbers\b|\bbinary addition\b|\bshow all your working\b/i.test(text) && /\[\d{1,2}\]/.test(text);
}

function looksLikeFillBlank(text) {
  return /complete the statements|use the terms from the list|translates the|interpreter translates|stops execution/i.test(String(text || ""));
}

function isRomanNumeral(value) {
  return /^(?:i|ii|iii|iv|v|vi|vii|viii|ix|x)$/i.test(value);
}

module.exports = {
  sliceQuestionPaper,
  findQuestionMarker,
  questionMarkerDiagnostics,
  cleanQuestionText,
  splitLeafQuestions,
  estimateMarks,
  markTokens,
  parseQuestionReference,
  topLevelQuestionNumber,
  classifyResponseLayout,
  questionId,
  stablePaperGroupId
};
