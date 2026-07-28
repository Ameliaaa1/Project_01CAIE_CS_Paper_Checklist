const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { PDFParse } = require("pdf-parse");

async function extractPdfGeometry(filePath) {
  const pymupdfGeometry = extractPyMuPdfGeometry(filePath);
  if (pymupdfGeometry) return pymupdfGeometry;
  return extractPdfParseGeometry(filePath);
}

function extractPyMuPdfGeometry(filePath) {
  const scriptPath = path.resolve(__dirname, "..", "..", "tools", "pdf_inspector", "extract_text_blocks.py");
  if (!fs.existsSync(scriptPath)) return null;
  const result = spawnSync("python3", [scriptPath, "--pdf", filePath], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 32
  });
  if (result.status !== 0) return null;

  const document = JSON.parse(result.stdout);
  const pageSpans = document.pages.map((page) => page.spans || []);
  const pageHeights = document.pages.map((page) => Number(page.height));
  const repeatedFooterKeys = collectRepeatedFooterKeys(pageSpans, pageHeights);
  const pages = document.pages.map((page) => canonicalPageFromSpans(page, document.pageCount, repeatedFooterKeys));
  return {
    pageCount: document.pageCount,
    pages
  };
}

async function extractPdfParseGeometry(filePath) {
  const parser = new PDFParse({ data: fs.readFileSync(filePath) });
  try {
    const document = await parser.load();
    const pages = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      const items = content.items
        .filter((item) => "str" in item && item.str.trim())
        .map((item) => ({
          text: normaliseInlineText(item.str),
          x: Number(item.transform[4]),
          y: Number(item.transform[5]),
          width: Number(item.width || 0),
          height: Math.max(8, Math.abs(Number(item.height || item.transform[3] || 10)))
        }))
        .filter((item) => item.text);
      const sortedItems = readingOrderItems(items, viewport.width, viewport.height).map((item, readingOrder) => ({
        ...item,
        readingOrder,
        globalOrder: (pageNumber - 1) * 10000 + readingOrder,
        regionType: classifyRegion(item, viewport.width, viewport.height)
      }));
      const rawText = sortedItems.map((item) => item.text).join(" ");
      const canonicalItems = sortedItems.filter((item) => isCanonicalTextRegion(item.regionType));
      const normalizedText = normalisePageText(canonicalItems.map((item) => item.text).join(" "));
      const displayText = displayPageText(normalizedText);
      const containsBackMatter = sortedItems.some((item) => item.regionType === "back_matter");
      const pageType = classifyPage(pageNumber, document.numPages, sortedItems);

      pages.push({
        pageNumber,
        width: viewport.width,
        height: viewport.height,
        rawText,
        normalizedText,
        displayText,
        pageType,
        requiresOcr: shouldRequireOcr(sortedItems),
        hasVisualContent: hasVisualSignals(sortedItems),
        containsBackMatter,
        contentRegions: contentRegions(sortedItems, viewport.height, pageType),
        textQuality: textQuality(rawText, normalizedText, displayText),
        sourceBlocks: sourceBlocks(canonicalItems, pageNumber),
        items: sortedItems
      });
      page.cleanup();
    }

    return {
      pageCount: document.numPages,
      pages
    };
  } finally {
    await parser.destroy();
  }
}

function canonicalPageFromSpans(page, pageCount, repeatedFooterKeys) {
  const width = Number(page.width);
  const height = Number(page.height);
  const rawItems = (page.spans || []).flatMap((span) => spanToItems(span, height, page.pageNumber)).filter((item) => item.text);
  const sortedItems = readingOrderItems(rawItems, width, height).map((item, readingOrder) => ({
    ...item,
    readingOrder,
    globalOrder: (page.pageNumber - 1) * 10000 + readingOrder,
    regionType: classifyRegion(item, width, height, repeatedFooterKeys)
  }));
  const rawText = sortedItems.map((item) => item.text).join(" ");
  const canonicalItems = sortedItems.filter((item) => isCanonicalTextRegion(item.regionType));
  const normalizedText = normalisePageText(canonicalItems.map((item) => item.text).join(" "));
  const displayText = displayPageText(normalizedText);
  const containsBackMatter = sortedItems.some((item) => item.regionType === "back_matter");
  const pageType = classifyPage(page.pageNumber, pageCount, sortedItems);

  return {
    pageNumber: page.pageNumber,
    width,
    height,
    rawText,
    normalizedText,
    displayText,
    pageType,
    requiresOcr: shouldRequireOcr(canonicalItems),
    hasVisualContent: hasVisualSignals(canonicalItems),
    containsBackMatter,
    contentRegions: contentRegions(pageType === "cover" ? sortedItems : canonicalItems, height, pageType),
    textQuality: textQuality(rawText, normalizedText, displayText),
    sourceBlocks: sourceBlocks(canonicalItems, page.pageNumber),
    keptSpanCount: canonicalItems.length,
    excludedSpanCount: sortedItems.length - canonicalItems.length,
    excludedSpans: sortedItems
      .filter((item) => !isCanonicalTextRegion(item.regionType))
      .map((item) => ({
        text: item.text,
        font: item.font,
        size: item.size,
        bbox: item.bboxTopLeft,
        blockIndex: item.blockIndex,
        regionType: item.regionType
      })),
    items: sortedItems
  };
}

function spanToItems(span, pageHeight, pageNumber = null) {
  const [x0, y0, x1, y1] = span.bbox || [0, 0, 0, 0];
  const sourceText = normaliseLegacySymbolGlyph(span.text, span.font);
  const preserveLegacyControl = /^[\u007f-\u009f]+$/.test(sourceText)
    && /Wingdings|Symbol|ZapfDingbats/i.test(String(span.font || ""));
  const text = preserveLegacyControl ? sourceText : normaliseInlineText(sourceText);
  if (!text) return [];
  const tokens = textTokens(text);
  const spanWidth = Math.max(0, Number(x1) - Number(x0));
  const charWidth = text.length ? spanWidth / text.length : 0;
  return tokens.map((token) => {
    const tokenX0 = Number(x0) + token.start * charWidth;
    const tokenX1 = Number(x0) + token.end * charWidth;
    return {
      text: token.text,
      sourceSpanText: text,
      pageNumber,
      x: tokenX0,
      y: Number(pageHeight - y1),
      width: Math.max(1, tokenX1 - tokenX0),
      height: Math.max(1, Number(y1) - Number(y0)),
      font: span.font || null,
      size: Number(span.size || 0),
      bboxTopLeft: [tokenX0, Number(y0), tokenX1, Number(y1)],
      blockIndex: span.blockIndex,
      lineIndex: span.lineIndex,
      spanIndex: span.spanIndex
    };
  });
}

function normaliseLegacySymbolGlyph(value, font) {
  const text = String(value || "");
  if (/^Wingdings(?:-Regular)?$/i.test(String(font || "")) && text === "ü") return "✓";
  return text;
}

function textTokens(text) {
  const tokens = [];
  const pattern = /\*\s*(?:\d\s*){8,16}\*|\.{6,}|\[[0-9]{1,2}\]|\([a-h]\)|\([ivx]+\)|[^\s]+/gi;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const value = match[0].trim();
    if (!value) continue;
    if (/^\d+\s+/.test(value)) {
      const leading = value.match(/^\d+/)[0];
      tokens.push({ text: leading, start: match.index, end: match.index + leading.length });
      const rest = value.slice(leading.length).trim();
      if (rest) tokens.push({ text: rest, start: match.index + leading.length + 1, end: match.index + value.length });
      continue;
    }
    tokens.push({
      text: value,
      start: match.index,
      end: match.index + match[0].length
    });
  }
  return tokens.length ? tokens : [{ text, start: 0, end: text.length }];
}

function spanToItem(span, pageHeight) {
  const [x0, y0, x1, y1] = span.bbox || [0, 0, 0, 0];
  return {
    text: normaliseInlineText(span.text),
    pageNumber: span.pageNumber,
    x: Number(x0),
    y: Number(pageHeight - y1),
    width: Math.max(0, Number(x1) - Number(x0)),
    height: Math.max(1, Number(y1) - Number(y0)),
    font: span.font || null,
    size: Number(span.size || 0),
    bboxTopLeft: [Number(x0), Number(y0), Number(x1), Number(y1)],
    blockIndex: span.blockIndex,
    lineIndex: span.lineIndex,
    spanIndex: span.spanIndex
  };
}

function publicPageSummary(page) {
  return {
    pageNumber: page.pageNumber,
    width: Math.round(page.width),
    height: Math.round(page.height),
    textItems: page.items.length,
    rawText: page.rawText,
    normalizedText: page.normalizedText,
    displayText: page.displayText,
    pageType: page.pageType,
    requiresOcr: page.requiresOcr,
    hasVisualContent: page.hasVisualContent,
    containsBackMatter: page.containsBackMatter,
    contentRegions: page.contentRegions,
    textQuality: page.textQuality,
    sourceBlocks: page.sourceBlocks,
    keptSpanCount: page.keptSpanCount,
    excludedSpanCount: page.excludedSpanCount,
    excludedSpans: page.excludedSpans,
    textPreview: page.displayText.slice(0, 260)
  };
}

function shouldRequireOcr(items) {
  if (!items.length) return true;
  const text = displayPageText(items.map((item) => item.text).join(" "));
  const alphaNumeric = (text.match(/[A-Za-z0-9]/g) || []).length;
  const ratio = text.length ? alphaNumeric / text.length : 0;
  return text.length < 80 || alphaNumeric < 60 || ratio < 0.35;
}

function textQuality(rawText, normalizedText, displayText) {
  const alphaNumeric = (displayText.match(/[A-Za-z0-9]/g) || []).length;
  return {
    rawCharacterCount: rawText.length,
    normalizedCharacterCount: normalizedText.length,
    displayCharacterCount: displayText.length,
    alphaNumericRatio: displayText.length ? Number((alphaNumeric / displayText.length).toFixed(3)) : 0,
    rawSuspiciousGlyphCount: suspiciousCharacterCount(rawText),
    normalizedSuspiciousGlyphCount: suspiciousCharacterCount(normalizedText),
    displaySuspiciousGlyphCount: suspiciousCharacterCount(displayText)
  };
}

function classifyPage(pageNumber, pageCount, items) {
  const text = normalisePageText(items.map((item) => item.text).join(" "));
  const containsBackMatter = items.some((item) => item.regionType === "back_matter");
  const containsQuestion = /\[\d{1,2}\]|\([a-h]\)|\([ivx]+\)/i.test(text);
  if (!text) return "blank";
  if (pageNumber === 1 && /Cambridge IGCSE|Instructions|Information|Paper \d/i.test(text)) return "cover";
  if (containsBackMatter && containsQuestion) return "mixed";
  if (containsQuestion) return "question_content";
  if (containsBackMatter) {
    return "back_matter";
  }
  if (/\bBLANK PAGE\b/i.test(text)) return "blank";
  if (/\[\d{1,2}\]/.test(text) || /^\d+\s/.test(text)) return "question_content";
  return "unknown";
}

function hasVisualSignals(items) {
  const text = normalisePageText(items.map((item) => item.text).join(" "));
  const keywordSignal = /\b(diagram|flowchart|table|graph|image|picture|complete the table|draw|tick|line from each|truth table)\b/i.test(text);
  const shortItems = items.filter((item) => item.text.length <= 4).length;
  const layoutSignal = items.length >= 35 && shortItems / items.length > 0.28;
  return keywordSignal || layoutSignal;
}

function readingOrderItems(items, pageWidth, pageHeight) {
  const landscape = pageWidth > pageHeight;
  return [...items].sort((a, b) => {
    if (landscape) return a.x - b.x || b.y - a.y;
    return b.y - a.y || a.x - b.x;
  });
}

function classifyRegion(item, pageWidth, pageHeight, repeatedFooterKeys = new Set()) {
  const text = String(item.text || "").trim();
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
  const repeatedKey = normalizeRepeatedBlock(text);
  const nearFooter = isNearFooter(item, pageHeight);
  const sourceSpanText = String(item.sourceSpanText || "");
  if (/^\[\d{1,2}\]$/.test(text)) return "content";
  if (/^\*\s*(?:\d\s*){8,16}\*$/.test(text)) return "barcode";
  if (isMachineReadableBarcode(item, pageWidth, pageHeight)) return "barcode";
  if (isLegacyControlBarcodeGlyph(item)) return "barcode";
  if (isAnswerLine(text)) return "answer_line";
  if ((item.x < 20 || item.x > pageWidth - 20) && item.height > pageHeight * 0.5) return "margin";
  if (/DO NOT WRITE IN THIS MARGIN/i.test(text)) return "margin";
  if (/^,?$/.test(text) && item.y > pageHeight - 70) return "header";
  if (/^\d{1,2}$/.test(text) && item.y > pageHeight - 70 && item.x > pageWidth * 0.4 && item.x < pageWidth * 0.6) return "header";
  if (isFooterControlToken(item, pageWidth, pageHeight)) return "footer";
  if (nearFooter && /\bPage\s+©\s+UCLES\s+\d{1,3}\s+of\s+20\d{2}\s+\d{1,3}\b/i.test(sourceSpanText)) return "footer";
  if (nearFooter && /^©\s+UCLES\s+20\d{2}$/i.test(sourceSpanText)) return "footer";
  if (isRotatedFooterSpan(item, pageWidth, sourceSpanText)) return "footer";
  if (
    nearFooter &&
    (
      /© UCLES|\b\d{4}\/\d{2}\/[A-Z]\/[A-Z]\/\d{2}\b|\[Turn over\]/i.test(text) ||
      (item.x > pageWidth * 0.75 && /^\[?turn$|^over$/i.test(text)) ||
      (item.size <= 8 && item.x < pageWidth * 0.2 && /^(?:©|UCLES|20\d{2})$/i.test(text)) ||
      repeatedFooterKeys.has(repeatedKey) ||
      suspiciousCharacterCount(text) >= 2 ||
      item.font === "AllAndNone2"
    )
  ) return "footer";
  if (/Permission to reproduce|Copyright Acknowledgements|Cambridge Assessment|publisher \(UCLES\)/i.test(text)) return "back_matter";
  if (item.size > 0 && item.size <= 7 && Array.isArray(item.bboxTopLeft) && item.bboxTopLeft[1] > pageHeight * 0.72) return "back_matter";
  if (item.y < 150 && /publisher will be pleased|cambridgeinternational\.org|live examination series/i.test(text)) return "back_matter";
  if (/^[, ]+$/.test(text)) return "glyph_noise";
  return "content";
}

function isFooterControlToken(item, pageWidth, pageHeight) {
  if (!isNearFooter(item, pageHeight)) return false;
  const text = String(item.text || "").trim();
  if (!text) return false;
  const smallFooterText = item.size > 0 && item.size <= 8.5;
  if (!smallFooterText) return false;
  if (/^(?:©|UCLES|20\d{2})$/i.test(text) && item.x < pageWidth * 0.18) return true;
  if (/^(?:Page|of|Mark|Scheme|Cambridge|IGCSE|PUBLISHED|October\/November|May\/June|Feb\/March|March)$/i.test(text)) return true;
  if (/^\d{4}\/\d{2}\/[A-Z]\/[A-Z]\/\d{2}$/i.test(text)) return true;
  if (/^\d{1,2}$/.test(text) && item.x > pageWidth * 0.45 && item.x < pageWidth * 0.58) return true;
  return false;
}

function isRotatedFooterSpan(item, pageWidth, sourceSpanText) {
  if (Number(item.x) < pageWidth * 0.85) return false;
  return /^©\s+UCLES\s+20\d{2}$/i.test(sourceSpanText)
    || /^Page\s+\d{1,3}\s+of\s+\d{1,3}$/i.test(sourceSpanText);
}

function isLegacyControlBarcodeGlyph(item) {
  const text = String(item.text || "");
  if (!text) return false;
  const controlOnly = /^[\u0000-\u001f\u007f-\u009f]+$/.test(text);
  if (!controlOnly) return false;
  const font = String(item.font || "");
  const legacySymbolFont = /^(?:Wingdings|Symbol|ZapfDingbats)/i.test(font);
  if (!legacySymbolFont) return false;
  const compact = item.width <= 24 && item.height <= 24;
  const visibleSize = item.size >= 8 && item.size <= 24;
  return compact && visibleSize;
}

function isAnswerLine(text) {
  return /^\.{4,}$/.test(text) || /^[1-9]?\s*\.{12,}$/.test(text) || /^Role\s+\.{8,}/i.test(text) || /^Function\s+\d\s+\.{8,}/i.test(text);
}

function isCanonicalTextRegion(regionType) {
  return regionType === "content";
}

function isMachineReadableBarcode(item, pageWidth, pageHeight) {
  const text = String(item.text || "");
  const bbox = Array.isArray(item.bboxTopLeft) ? item.bboxTopLeft : null;
  const y0 = bbox ? Number(bbox[1]) : pageHeight - item.y - item.height;
  const y1 = bbox ? Number(bbox[3]) : pageHeight - item.y;
  const inBarcodeBand = y0 <= pageHeight * 0.08 || y0 >= pageHeight * 0.90;
  const inSideBarcodeBand = item.x <= pageWidth * 0.1 && y0 <= pageHeight * 0.25;
  const narrow = item.width <= Math.max(18, pageWidth * 0.04);
  const compact = item.height <= 18;
  const machineFont = item.font === "AllAndNone2" || (item.size > 0 && item.size <= 5.5);
  const abnormal = suspiciousCharacterCount(text) > 0 || /[\u0000-\u001f\u007f-\u009f]/.test(text);
  return Boolean(machineFont && (inBarcodeBand || inSideBarcodeBand) && compact && (narrow || abnormal || y1 >= pageHeight * 0.94));
}

function sourceBlocks(items, pageNumber) {
  const seen = new Set();
  return items
    .filter((item) => item.blockIndex !== undefined && item.blockIndex !== null)
    .map((item) => ({
      page: pageNumber,
      blockIndex: item.blockIndex,
      lineIndex: item.lineIndex,
      spanIndex: item.spanIndex,
      text: item.text
    }))
    .filter((record) => {
      const key = `${record.page}:${record.blockIndex}:${record.lineIndex}:${record.spanIndex}:${record.text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function contentRegions(items, pageHeight, pageType = "unknown") {
  if (!items.length) return [];
  if (pageType === "cover") return coverContentRegions(items, pageHeight);
  const questionItems = items.filter((item) => item.regionType === "content" || item.regionType === "answer_line");
  const backMatterItems = items.filter((item) => item.regionType === "back_matter");
  const regions = [];
  if (questionItems.length) {
    const yMin = pageHeight - Math.max(...questionItems.map((item) => item.y + item.height));
    const yMax = pageHeight - Math.min(...questionItems.map((item) => item.y));
    regions.push({
      type: "question_content",
      yMin: Math.round(yMin),
      yMax: Math.round(yMax)
    });
  }
  if (backMatterItems.length) {
    const yMin = pageHeight - Math.max(...backMatterItems.map((item) => item.y + item.height));
    const yMax = pageHeight - Math.min(...backMatterItems.map((item) => item.y));
    regions.push({
      type: "back_matter",
      yMin: Math.round(yMin),
      yMax: Math.round(yMax)
    });
  }
  return regions.length ? regions : [{ type: "unknown", yMin: 0, yMax: Math.round(pageHeight) }];
}

function coverContentRegions(items, pageHeight) {
  const barcodeItems = items.filter((item) => item.regionType === "barcode");
  const metadataItems = items.filter((item) => {
    const text = String(item.text || "");
    return /Cambridge IGCSE|COMPUTER SCIENCE|Paper \d|May\/June|READ THESE INSTRUCTIONS|INFORMATION/i.test(text);
  });
  const instructionItems = items.filter((item) => {
    const text = String(item.text || "");
    return /INSTRUCTIONS|Answer all questions|Use a black or dark blue pen|You may use an HB pencil|Do not use/i.test(text);
  });
  const regions = [];
  addRegion(regions, "cover_metadata", metadataItems, pageHeight);
  addRegion(regions, "instructions", instructionItems, pageHeight);
  addRegion(regions, "barcode", barcodeItems, pageHeight);
  return regions.length ? regions : [{ type: "cover_metadata", yMin: 0, yMax: Math.round(pageHeight) }];
}

function addRegion(regions, type, items, pageHeight) {
  if (!items.length) return;
  const yMin = pageHeight - Math.max(...items.map((item) => item.y + item.height));
  const yMax = pageHeight - Math.min(...items.map((item) => item.y));
  regions.push({
    type,
    yMin: Math.round(yMin),
    yMax: Math.round(yMax)
  });
}

function normaliseInlineText(value) {
  return String(value || "").replace(/[\u0000-\u001f\u008f]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalisePageText(value) {
  let text = normaliseInlineText(value);
  if (/\brotated through 360\b/i.test(text) && text.includes("Å")) {
    text = text.replace(/Å/g, "°");
  }
  return text
    .replace(/[\u007f-\u009f]+/g, " ")
    .replace(/^\*\s*\d{10,16}\s*\*$/gm, " ")
    .replace(/\*\s*(?:\d\s*){8,16}\*/g, " ")
    .replace(/\bPage\s+©\s+UCLES\s+\d{1,3}\s+of\s+\d{1,3}\b/gi, " ")
    .replace(/© UCLES \d{4}/g, " ")
    .replace(/\b\d{4}\/\d{2}\/[A-Z]\/[A-Z]\/\d{2}\b/g, " ")
    .replace(/\[?Turn over\b\]?/gi, " ")
    .replace(/\bDO NOT WRITE IN THIS MARGIN\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function displayPageText(value) {
  return normalisePageText(value)
    .replace(/\bThis document has \d+ pages\.\b/gi, " ")
    .replace(/^\s*\d{1,2}\s+(?:,\s*){1,4}/, " ")
    .replace(/\b\d{4}\/\d{2}\/[A-Z]\/[A-Z]\/\d{2}\b/g, " ")
    .replace(/\[?Turn over\b[^A-Za-z0-9]*(?=(?:\d+\s|$))/gi, " ")
    .replace(/\bPermission to reproduce[\s\S]*$/gi, " ")
    .replace(/\.{4,}/g, " ")
    .replace(/\bWorking space\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function suspiciousGlyphPattern() {
  return /[\u00c0-\u00d6\u00d8-\u024f]/g;
}

function suspiciousCharacterCount(text) {
  const value = String(text || "");
  return [...value.matchAll(suspiciousGlyphPattern())]
    .filter((match) => !isLegalTextGlyph(value, match[0], match.index))
    .length;
}

function isLegalTextGlyph(text, symbol, index) {
  if (symbol === "÷") return true;
  if (symbol === "ü" && isCharacterEncodingTableContext(text, index)) return true;
  if (symbol === "ü" && isTickBoxContext(text, index)) return true;
  if (["é", "è"].includes(symbol) && isNaturalLanguageWordContext(text, index)) return true;
  return isLegalNullPointerGlyph(text, symbol, index);
}

function isTickBoxContext(text, index) {
  const nearby = text.slice(Math.max(0, index - 40), Math.min(text.length, index + 41));
  return /Tick\s*\(\s*ü(?:\s*\)|\s+value\b)/i.test(nearby);
}

function isNaturalLanguageWordContext(text, index) {
  const before = text[index - 1] || "";
  const after = text[index + 1] || "";
  return /[A-Za-z]/.test(before) || /[A-Za-z]/.test(after);
}

function isCharacterEncodingTableContext(text, index) {
  const nearby = text.slice(Math.max(0, index - 600), Math.min(text.length, index + 601));
  const tableHeaders = /\bCharacter\b[\s\S]*\bDenary\b[\s\S]*\b(?:Binary|8[–-]?bit)\b[\s\S]*\bHexadecimal\b/i;
  const encodedValue = /(?:ü\s+252\b|\b252\s+1111\s*1100\b|ü\s+FC\b)/i;
  return tableHeaders.test(nearby) && encodedValue.test(nearby);
}

function isLegalNullPointerGlyph(text, symbol, index) {
  if (symbol !== "Ø" || !/\blink(?:ed)?[-\s]+list\b/i.test(text)) return false;
  const supportingSignals = [
    /\bfree[-\s]+list\b/i,
    /\bnull[-\s]+(?:pointer|link)\b/i,
    /\bpointer\b/i,
    /\bnode\b/i,
    /\b(?:abstract data type|ADT)\b/i
  ];
  if (!supportingSignals.some((pattern) => pattern.test(text))) return false;
  const nearby = text.slice(Math.max(0, index - 180), Math.min(text.length, index + 181));
  return /\b(?:link(?:ed)?[-\s]+list|free[-\s]+list|null[-\s]+(?:pointer|link)|pointer|node|ADT)\b/i.test(nearby);
}

function isBackMatterText(value) {
  const text = normaliseInlineText(value);
  if (!text) return false;
  if (/Permission to reproduce|publisher will be pleased to make amends/i.test(text)) return true;

  const signals = [
    /copyright acknowledgements/i,
    /Cambridge Assessment International Education/i,
    /Cambridge Local Examinations Syndicate/i,
    /third-party owned material/i,
    /live examination series/i,
    /publisher \(UCLES\)/i
  ];
  return signals.filter((pattern) => pattern.test(text)).length >= 2;
}

function isNearFooter(item, pageHeight) {
  if (Array.isArray(item.bboxTopLeft)) return Number(item.bboxTopLeft[1]) >= pageHeight * 0.8;
  return item.y < pageHeight * 0.2;
}

function normalizeRepeatedBlock(text) {
  return String(text || "")
    .replace(/\d+/g, "<N>")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function collectRepeatedFooterKeys(pageSpans, pageHeights) {
  const counts = new Map();
  pageSpans.forEach((spans, pageIndex) => {
    const pageHeight = pageHeights[pageIndex];
    spans.forEach((span) => {
      const [, y0] = span.bbox || [];
      if (Number(y0) < pageHeight * 0.8) return;
      const key = normalizeRepeatedBlock(span.text);
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });
  return new Set([...counts.entries()].filter(([, count]) => count >= 2).map(([key]) => key));
}

module.exports = {
  extractPdfGeometry,
  publicPageSummary,
  normalisePageText,
  displayPageText,
  classifyPage,
  hasVisualSignals,
  shouldRequireOcr,
  readingOrderItems,
  classifyRegion,
  isBackMatterText,
  suspiciousCharacterCount
};
