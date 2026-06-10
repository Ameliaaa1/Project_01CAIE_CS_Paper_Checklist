const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = __dirname;
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8"
};

const data = loadAppData();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === "/api/health") {
      sendJson(res, { ok: true, app: "PaperLens", mode: "full-stack" });
      return;
    }

    if (url.pathname === "/api/content") {
      sendJson(res, {
        topics: data.topicBank.length,
        sources: data.sourceLibrary.length,
        papers: data.paperSessions.length,
        syllabus: data.syllabusChecklist
      });
      return;
    }

    if (url.pathname === "/api/search") {
      const query = url.searchParams.get("q") || "";
      sendJson(res, { matches: findKnowledgeMatches(query).slice(0, 8) });
      return;
    }

    if (url.pathname === "/api/analyze" && req.method === "POST") {
      const body = await readJsonBody(req);
      sendJson(res, analyzeMaterials(body));
      return;
    }

    if (url.pathname === "/api/export" && req.method === "POST") {
      const body = await readJsonBody(req);
      const analysis = analyzeMaterials(body);
      const format = String(body.format || "json").toLowerCase();
      const exportBody = exportChecklist(analysis.checklist, format);
      res.writeHead(200, {
        "Content-Type": exportBody.type,
        "Content-Disposition": `attachment; filename="${exportBody.filename}"`
      });
      res.end(exportBody.content);
      return;
    }

    serveStatic(url.pathname, res);
  } catch (error) {
    sendJson(res, { error: "Server error", detail: error.message }, 500);
  }
});

server.listen(port, host, () => {
  console.log(`PaperLens full-stack server running at http://${host}:${port}`);
});

function loadAppData() {
  const appSource = fs.readFileSync(path.join(rootDir, "app.js"), "utf8");
  const dataSource = appSource.slice(0, appSource.indexOf("const state ="));
  const context = {};
  vm.createContext(context);
  vm.runInContext(
    `${dataSource}
    globalThis.__paperlensData = {
      topicBank,
      sourceLibrary,
      syllabusChecklist,
      chapterOneSections,
      paperSessions
    };`,
    context,
    { filename: "paperlens-data.js" }
  );
  return context.__paperlensData;
}

function analyzeMaterials(options = {}) {
  const paperFocus = options.paperFocus || "both";
  const threshold = Number(options.threshold || 70);
  const manual = String(options.manual || "").trim();
  const docs = data.sourceLibrary
    .filter((source) => source.paper === undefined || source.paper === "both" || paperFocus === "both" || source.paper === paperFocus)
    .map((source) => ({ ...source, kind: source.paper || "source" }));

  if (manual) {
    docs.push({ name: "Admin notes", kind: "manual", text: manual });
  }

  const paperText = docs.map((doc) => doc.text).join("\n");
  const syllabusText = data.sourceLibrary.map((doc) => doc.text).join("\n");
  const allText = docs.map((doc) => doc.text).join("\n");
  const totalSignals = countWords(allText);
  const results = data.topicBank
    .map((topic) => scoreTopic(topic, paperText, syllabusText, allText))
    .sort((a, b) => b.priority - a.priority);
  const checklist = buildChecklist(results, threshold);
  const coverage = results.filter((item) => item.totalHits > 0);

  return {
    docs,
    results,
    checklist,
    practicePrompts: checklist.slice(0, 6).map(practicePrompt),
    summary: {
      docCount: docs.length,
      wordCount: totalSignals,
      hotTopic: results[0] && results[0].priority ? results[0].name.split(" ")[0] : "-",
      coverageScore: coverage.length ? Math.round(coverage.reduce((sum, item) => sum + item.coverage, 0) / coverage.length) : 0
    }
  };
}

function scoreTopic(topic, paperText, syllabusText, allText) {
  const paperHits = countHits(paperText, topic.keywords);
  const syllabusHits = countHits(syllabusText, topic.keywords);
  const totalHits = countHits(allText, topic.keywords);
  const coverage = totalHits === 0 ? 0 : Math.min(100, Math.round((syllabusHits / Math.max(1, paperHits + syllabusHits)) * 150));
  const recurrenceBoost = Math.min(34, paperHits * 4);
  const priority = Math.min(100, Math.round(totalHits * 7 + recurrenceBoost));
  const matched = topic.keywords.filter((keyword) => new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i").test(allText));

  return {
    ...topic,
    paperHits,
    bookHits: syllabusHits,
    totalHits,
    coverage,
    priority,
    matched
  };
}

function buildChecklist(results, threshold) {
  return results
    .filter((topic) => topic.priority > 0)
    .slice(0, 12)
    .map((topic, index) => ({
      id: index + 1,
      topic: topic.name,
      priority: topic.priority,
      coverage: topic.coverage,
      status: topic.priority >= threshold ? "urgent" : topic.priority >= 45 ? "important" : "review",
      action: topic.focus,
      evidence: evidenceSentence(topic),
      keywords: topic.matched.slice(0, 7)
    }));
}

function knowledgeSearchIndex() {
  const syllabusEntries = Object.entries(data.syllabusChecklist).flatMap(([paper, chapters]) =>
    chapters.flatMap((chapter) =>
      chapter.sections.flatMap((section) => {
        const context = `${paper === "paper1" ? "Paper 1 Theory" : "Paper 2 Algorithms"} · Chapter ${chapter.chapter}: ${chapter.title}`;
        const sectionTarget = sectionId(section.code);
        const sectionEntry = {
          title: `${section.code} ${section.title}`,
          context,
          body: section.items.join(" "),
          targetId: sectionTarget
        };
        const itemEntries = section.items.map((item, index) => ({
          title: item.split(":")[0],
          context: `${context} · ${section.code} ${section.title}`,
          body: item,
          targetId: `${sectionTarget}-item-${index + 1}`
        }));
        return [sectionEntry, ...itemEntries];
      })
    )
  );

  const chapterOneEntries = data.chapterOneSections.map((section) => ({
    title: section.title,
    context: `Chapter 1 extended guide - ${section.tag}`,
    body: `${section.summary} ${section.bullets.join(" ")} ${section.terms.join(" ")}`,
    targetId: chapterOneId(section.number)
  }));

  const topicEntries = data.topicBank.map((topic) => ({
    title: topic.name,
    context: "Revision analyzer topic bank",
    body: `${topic.focus} ${topic.keywords.join(" ")}`,
    targetId: "paper-1-checklist"
  }));

  return [...syllabusEntries, ...chapterOneEntries, ...topicEntries].map((entry) => ({
    ...entry,
    searchText: normaliseSearchText(`${entry.title} ${entry.context} ${entry.body}`),
    tokens: searchTokens(`${entry.title} ${entry.context} ${entry.body}`)
  }));
}

function findKnowledgeMatches(query) {
  const normalisedQuery = normaliseSearchText(query);
  const queryTokens = searchTokens(query);
  if (!normalisedQuery || !queryTokens.length) return [];

  return knowledgeSearchIndex()
    .map((entry) => {
      const exactPhrase = entry.searchText.includes(normalisedQuery);
      const tokenScore = queryTokens.reduce((total, token) => {
        if (entry.tokens.includes(token)) return total + 16;
        if (entry.tokens.some((entryToken) => entryToken.includes(token) || token.includes(entryToken))) return total + 11;
        const closest = Math.max(...entry.tokens.map((entryToken) => similarityScore(token, entryToken)), 0);
        return total + closest * 7;
      }, 0);
      const titleBoost = normaliseSearchText(entry.title).includes(normalisedQuery) ? 30 : 0;
      const score = (exactPhrase ? 80 : 0) + titleBoost + tokenScore / queryTokens.length;
      return { ...entry, isExact: exactPhrase || titleBoost > 0, score: Math.round(score) };
    })
    .filter((entry) => entry.score >= 6)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

function practicePrompt(item) {
  const command = {
    "Algorithms and problem solving": "Create a trace table for a loop-based algorithm, then explain the final output.",
    "Programming constructs": "Write pseudocode for a small validation routine using selection and iteration.",
    Databases: "Design a table with suitable fields and keys, then write one query that filters the records.",
    "Boolean logic": "Draw the truth table for a compound logic statement and simplify the output pattern.",
    Networks: "Compare two network setups for a school and justify the safer option.",
    "Cyber security": "Identify threats in a login scenario and recommend controls with reasons."
  }[item.topic];

  return command || `Write an exam-style answer that explains ${item.topic.toLowerCase()} in a practical scenario, using precise technical vocabulary.`;
}

function exportChecklist(checklist, format) {
  if (format === "md" || format === "markdown") {
    return {
      filename: "paperlens-checklist.md",
      type: "text/markdown; charset=utf-8",
      content: ["# CAIE Computer Science Revision Checklist", "", ...checklist.map((item) => `- [ ] **${item.topic}** (${item.status}, ${item.priority}%) - ${item.action} Evidence: ${item.evidence}`)].join("\n")
    };
  }

  if (format === "csv") {
    const rows = [["topic", "status", "priority", "coverage", "action", "evidence"]];
    checklist.forEach((item) => rows.push([item.topic, item.status, item.priority, item.coverage, item.action, item.evidence]));
    return {
      filename: "paperlens-checklist.csv",
      type: "text/csv; charset=utf-8",
      content: rows.map((row) => row.map(csvCell).join(",")).join("\n")
    };
  }

  return {
    filename: "paperlens-checklist.json",
    type: "application/json; charset=utf-8",
    content: JSON.stringify(checklist, null, 2)
  };
}

function serveStatic(requestPath, res) {
  const cleanPath = decodeURIComponent(requestPath.split("?")[0]);
  const filePath = path.normalize(path.join(rootDir, cleanPath === "/" ? "index.html" : cleanPath));

  if (!filePath.startsWith(rootDir)) {
    sendJson(res, { error: "Forbidden" }, 403);
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, { error: "Not found" }, 404);
      return;
    }

    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    res.end(content);
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
  });
}

function sendJson(res, payload, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function evidenceSentence(topic) {
  const words = topic.matched.length ? topic.matched.slice(0, 5).join(", ") : "no exact keywords";
  return `Found ${topic.paperHits} built-in paper signals and ${topic.bookHits} syllabus-era signals. Matched terms: ${words}.`;
}

function countHits(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.reduce((total, keyword) => {
    const matches = lower.match(new RegExp(`\\b${escapeRegExp(keyword.toLowerCase())}\\b`, "g"));
    return total + (matches ? matches.length : 0);
  }, 0);
}

function countWords(text) {
  return (text.trim().match(/\b[\w'-]+\b/g) || []).length;
}

function sectionId(code) {
  return `section-${String(code).replaceAll(".", "-")}`;
}

function chapterOneId(number) {
  return `chapter-one-${slugPart(number)}`;
}

function slugPart(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normaliseSearchText(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function searchTokens(value) {
  return normaliseSearchText(value)
    .split(" ")
    .filter((token) => token.length > 1);
}

function similarityScore(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

function levenshteinDistance(a, b) {
  const rows = Array.from({ length: a.length + 1 }, (_, index) => [index]);
  for (let column = 1; column <= b.length; column += 1) rows[0][column] = column;
  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      rows[row][column] = Math.min(rows[row - 1][column] + 1, rows[row][column - 1] + 1, rows[row - 1][column - 1] + cost);
    }
  }
  return rows[a.length][b.length];
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}
