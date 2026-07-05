const fs = require("node:fs");
const http = require("node:http");
const crypto = require("node:crypto");
const path = require("node:path");
const { PDFDocument } = require("pdf-lib");
const sharedData = require("./data/paperlens-data");

let PDFParse = null;
try {
  ({ PDFParse } = require("pdf-parse"));
} catch {
  PDFParse = null;
}

let canvasTools = null;
try {
  canvasTools = require("@napi-rs/canvas");
} catch {
  canvasTools = null;
}

const rootDir = __dirname;
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(rootDir, "data");
const usersDbPath = path.join(dataDir, "users.json");
const checkoutDbPath = path.join(dataDir, "checkout-sessions.json");
const redisRestUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const redisRestToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const useRemoteStore = Boolean(redisRestUrl && redisRestToken);
const usersStoreKey = process.env.PAPERLENS_USERS_KEY || "paperlens:users";
const checkoutStoreKey = process.env.PAPERLENS_CHECKOUT_KEY || "paperlens:checkout-sessions";
const lifetimeAccessPriceCny = 20;
const questionFinderTrialLimit = 2;
const sessionCookieName = "paperlens_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;
const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET || (isProduction ? "" : crypto.randomBytes(32).toString("hex"));
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripePriceId = process.env.STRIPE_PRICE_ID || "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const stripeWebhookToleranceSeconds = 300;
const useMockStripeCheckout = process.env.STRIPE_CHECKOUT_MOCK === "1" && !isProduction;
const publicBaseUrl = (process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || "").replace(/\/+$/, "");
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

const publicStaticFiles = new Set([
  "index.html",
  "login.html",
  "signup.html",
  "checkout.html",
  "data/paperlens-data.js",
  "app.js",
  "auth.js",
  "checkout.js",
  "styles.css",
  "auth.css",
  "assets/study-workspace.png"
]);

assertProductionConfiguration();

const data = loadAppData();
const parsedPdfGeometryCache = new Map();
const questionPreviewCache = new Map();
const rateLimitBuckets = new Map();

async function handleRequest(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    await enforceRateLimit(req, url);

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

    if (url.pathname === "/api/question-finder/access" && req.method === "POST") {
      const user = await optionalAuthenticatedUser(req);
      if (user) assertTrustedOrigin(req);
      sendJson(res, await questionFinderAccess(user));
      return;
    }

    if (url.pathname === "/api/question-search" && req.method === "POST") {
      const body = await readJsonBody(req);
      const user = await requireAuthenticatedUser(req);
      assertTrustedOrigin(req);
      sendJson(res, await searchQuestionFinder(body, user));
      return;
    }

    if (url.pathname === "/api/question-preview" && req.method === "GET") {
      const question = questionById(url.searchParams.get("id") || "");
      if (!question) throwHttpError("Question not found.", 404);
      const type = url.searchParams.get("type") === "ms" ? "ms" : "qp";
      await assertQuestionPreviewAccess(question.id, await requireAuthenticatedUser(req));
      const preview = await buildQuestionPreview(question, type);
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=300"
      });
      res.end(preview);
      return;
    }

    if (url.pathname === "/api/auth/check-email" && req.method === "POST") {
      const body = await readJsonBody(req);
      const email = normaliseEmail(body.email);
      if (!isValidEmail(email)) {
        sendJson(res, { error: "Enter a valid email address." }, 400);
        return;
      }
      sendJson(res, { registered: Boolean(await findUserByEmail(email)) });
      return;
    }

    if (url.pathname === "/api/auth/signup" && req.method === "POST") {
      const body = await readJsonBody(req);
      const result = await createUser(body);
      setSessionCookie(res, result.user.id, req);
      sendJson(res, result, 201);
      return;
    }

    if (url.pathname === "/api/auth/login" && req.method === "POST") {
      const body = await readJsonBody(req);
      const result = await loginUser(body);
      setSessionCookie(res, result.user.id, req);
      sendJson(res, result);
      return;
    }

    if (url.pathname === "/api/auth/session" && req.method === "POST") {
      const user = await requireAuthenticatedUser(req);
      assertTrustedOrigin(req);
      sendJson(res, { ok: true, user: publicUser(user) });
      return;
    }

    if (url.pathname === "/api/auth/logout" && req.method === "POST") {
      await requireAuthenticatedUser(req);
      assertTrustedOrigin(req);
      clearSessionCookie(res, req);
      sendJson(res, { ok: true });
      return;
    }

    if (url.pathname === "/api/billing/create-checkout" && req.method === "POST") {
      const user = await requireAuthenticatedUser(req);
      assertTrustedOrigin(req);
      sendJson(res, await createCheckoutSession(user, req));
      return;
    }

    if (url.pathname === "/api/billing/status" && req.method === "GET") {
      sendJson(res, await checkoutSessionStatus(url.searchParams.get("session") || "", await requireAuthenticatedUser(req)));
      return;
    }

    if (url.pathname === "/api/billing/complete" && req.method === "POST") {
      throwHttpError("Checkout completion must be confirmed by the payment provider.", 410);
    }

    if (url.pathname === "/api/billing/stripe-webhook" && req.method === "POST") {
      const rawBody = await readRawBody(req);
      const event = verifyStripeWebhookEvent(rawBody, req.headers["stripe-signature"] || "");
      sendJson(res, await handleStripeWebhookEvent(event));
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

    if (url.pathname === "/api/question-pdf" && req.method === "POST") {
      const body = await readJsonBody(req);
      const user = await requireAuthenticatedUser(req);
      assertTrustedOrigin(req);
      await assertQuestionPdfAccess(body, user);
      const pdf = await buildQuestionPdf(body);
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdf.filename}"`
      });
      res.end(Buffer.from(pdf.content));
      return;
    }

    serveStatic(url.pathname, res);
  } catch (error) {
    if (error.retryAfter) res.setHeader("Retry-After", String(error.retryAfter));
    sendJson(res, { error: error.status ? error.message : "Server error", detail: error.message }, error.status || 500);
  }
}

if (require.main === module) {
  const server = http.createServer(handleRequest);
  server.listen(port, host, () => {
    console.log(`PaperLens full-stack server running at http://${host}:${port}`);
  });
}

module.exports = handleRequest;

function loadAppData() {
  const appData = {
    topicBank: sharedData.topicBank,
    sourceLibrary: sharedData.sourceLibrary,
    syllabusChecklist: sharedData.syllabusChecklist,
    chapterOneSections: sharedData.chapterOneSections,
    paperSessions: sharedData.paperSessions,
    pastPaperQuestionBank: [...sharedData.pastPaperQuestionBank]
  };
  const generatedEntries = loadGeneratedQuestionEntries();
  const manualKeys = new Set(appData.pastPaperQuestionBank.map(questionBankKey));
  appData.pastPaperQuestionBank = [
    ...appData.pastPaperQuestionBank,
    ...generatedEntries.filter((entry) => !manualKeys.has(questionBankKey(entry)))
  ];
  return appData;
}

function loadGeneratedQuestionEntries() {
  const indexPath = path.join(rootDir, "generated", "question-index.json");
  if (!fs.existsSync(indexPath)) return [];

  try {
    const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    return Array.isArray(index.entries) ? index.entries : [];
  } catch {
    return [];
  }
}

function questionBankKey(entry) {
  return `${String(entry.paper || "").trim()}|${String(entry.ref || "").trim().toUpperCase()}`;
}

function assertProductionConfiguration() {
  if (!isProduction) return;

  const missing = [];
  if (!process.env.SESSION_SECRET) missing.push("SESSION_SECRET");
  if (!stripeSecretKey) missing.push("STRIPE_SECRET_KEY");
  if (!stripePriceId) missing.push("STRIPE_PRICE_ID");
  if (!stripeWebhookSecret) missing.push("STRIPE_WEBHOOK_SECRET");
  if (!publicBaseUrl) missing.push("PUBLIC_BASE_URL or APP_BASE_URL");
  if (!useRemoteStore) missing.push("KV_REST_API_URL/KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN");
  if (process.env.STRIPE_CHECKOUT_MOCK === "1") missing.push("STRIPE_CHECKOUT_MOCK must be disabled");
  if (!PDFParse) missing.push("pdf-parse dependency");
  if (!canvasTools) missing.push("@napi-rs/canvas dependency");

  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    missing.push("SESSION_SECRET with at least 32 characters");
  }

  if (missing.length) {
    throw new Error(`Production configuration is incomplete: ${missing.join(", ")}`);
  }
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

async function questionFinderAccess(user = null) {
  if (!user) {
    return {
      loggedIn: false,
      purchased: false,
      trialLimit: questionFinderTrialLimit,
      used: 0,
      remaining: 0,
      canSearch: false
    };
  }

  const searches = questionFinderSearches(user);
  const used = Math.min(questionFinderTrialLimit, searches.length);
  return {
    loggedIn: true,
    purchased: Boolean(user.purchased),
    trialLimit: questionFinderTrialLimit,
    used,
    remaining: user.purchased ? null : Math.max(0, questionFinderTrialLimit - used),
    canSearch: Boolean(user.purchased) || used < questionFinderTrialLimit
  };
}

async function searchQuestionFinder(body = {}, user) {
  const db = await readUsersDb();
  const dbUser = db.users.find((candidate) => candidate.id === user.id);
  if (!dbUser) throwHttpError("Log in to use your two free Question Finder searches.", 401);

  const query = String(body.query || "").trim();
  const syllabusIds = normaliseSyllabusIds(body.syllabusIds);
  if (!query) throwHttpError("Enter a knowledge point.", 400);
  if (!syllabusIds.length) throwHttpError("Select at least one syllabus.", 400);

  const matches = findQuestionMatches(query, syllabusIds).slice(0, 30);
  const key = questionFinderSearchKey(query, syllabusIds);
  const searches = questionFinderSearches(dbUser);
  const existing = searches.find((search) => search.key === key);

  if (!matches.length) {
    return {
      matches: [],
      trialConsumed: false,
      searchId: null,
      access: questionFinderAccessForUser(dbUser)
    };
  }

  if (!dbUser.purchased && !existing && searches.length >= questionFinderTrialLimit) {
    throwHttpError("Your two free Question Finder searches are complete. Buy access for unlimited searches.", 402);
  }

  let search = existing;
  if (!dbUser.purchased && !search) {
    search = {
      id: crypto.randomUUID(),
      key,
      query: normaliseSearchText(query),
      syllabusIds,
      questionIds: matches.map((match) => match.id),
      createdAt: new Date().toISOString()
    };
    searches.push(search);
    dbUser.questionFinderSearches = searches;
    await writeUsersDb(db);
  }

  return {
    matches,
    trialConsumed: Boolean(!dbUser.purchased && !existing),
    searchId: search?.id || null,
    access: questionFinderAccessForUser(dbUser)
  };
}

async function assertQuestionPdfAccess(body = {}, user) {
  if (user.purchased) return;

  const requestedIds = Array.isArray(body.questionIds) ? body.questionIds.map(String) : [];
  const allowedIds = new Set(questionFinderSearches(user).flatMap((search) => search.questionIds || []));
  if (!requestedIds.length || requestedIds.some((id) => !allowedIds.has(id))) {
    throwHttpError("These questions are not part of one of your free searches.", 403);
  }
}

async function assertQuestionPreviewAccess(questionId, user) {
  if (user.purchased) return;
  const allowedIds = new Set(questionFinderSearches(user).flatMap((search) => search.questionIds || []));
  if (!allowedIds.has(questionId)) throwHttpError("This question is not part of one of your free searches.", 403);
}

function questionById(id) {
  return questionSearchIndex().find((question) => question.id === id) || null;
}

function questionFinderSearches(user) {
  return Array.isArray(user.questionFinderSearches) ? user.questionFinderSearches : [];
}

function questionFinderAccessForUser(user) {
  const used = Math.min(questionFinderTrialLimit, questionFinderSearches(user).length);
  return {
    loggedIn: true,
    purchased: Boolean(user.purchased),
    trialLimit: questionFinderTrialLimit,
    used,
    remaining: user.purchased ? null : Math.max(0, questionFinderTrialLimit - used),
    canSearch: Boolean(user.purchased) || used < questionFinderTrialLimit
  };
}

function normaliseSyllabusIds(value) {
  const supported = new Set(["caie-igcse-0478"]);
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.map(String).filter((id) => supported.has(id)))];
}

function questionFinderSearchKey(query, syllabusIds) {
  return crypto.createHash("sha256").update(`${normaliseSearchText(query)}|${[...syllabusIds].sort().join(",")}`).digest("hex");
}

function findQuestionMatches(query, syllabusIds = ["caie-igcse-0478"]) {
  const normalisedQuery = normaliseSearchText(query);
  const queryTokens = searchTokens(query);
  if (!normalisedQuery || !queryTokens.length) return [];

  const allowedSyllabuses = new Set(normaliseSyllabusIds(syllabusIds));
  return questionSearchIndex()
    .filter((entry) => allowedSyllabuses.has(entry.syllabusId))
    .map((entry) => {
      const exactPhrase = entry.searchText.includes(normalisedQuery);
      const tokenScore = queryTokens.reduce((total, token) => {
        if (entry.tokens.includes(token)) return total + 22;
        if (entry.tokens.some((entryToken) => entryToken.includes(token) || token.includes(entryToken))) return total + 13;
        const closest = Math.max(...entry.tokens.map((entryToken) => similarityScore(token, entryToken)), 0);
        return total + closest * 11;
      }, 0);
      const titleText = normaliseSearchText(`${entry.knowledge} ${entry.sectionTitle} ${entry.chapterTitle}`);
      const titleBoost = titleText.includes(normalisedQuery) ? 34 : 0;
      const score = (exactPhrase ? 84 : 0) + titleBoost + tokenScore / queryTokens.length;
      return { ...entry, score: Math.round(score), isExact: exactPhrase || titleBoost > 0 };
    })
    .filter((entry) => entry.score >= 20)
    .sort((a, b) => b.score - a.score || b.paper.localeCompare(a.paper));
}

function questionSearchIndex() {
  return data.pastPaperQuestionBank.map((hit, index) => {
    const section = syllabusSectionByCode(hit.section);
    const chapter = syllabusChapterForSection(hit.section);
    const sectionTitle = section ? `${section.code} ${section.title}` : hit.section;
    const chapterTitle = chapter ? `${chapter.chapter}. ${chapter.title}` : "";
    const tags = extractSearchTerms(`${hit.knowledge} ${hit.question} ${hit.answer} ${sectionTitle} ${chapterTitle}`);
    const source = hit.ref ? `${hit.paper} ${hit.ref}` : hit.paper;
    const searchBody = [hit.knowledge, hit.question, hit.answer, sectionTitle, chapterTitle, tags.join(" ")].join(" ");

    return {
      ...hit,
      syllabusId: hit.syllabusId || "caie-igcse-0478",
      id: questionId(hit, index),
      index,
      source,
      sectionTitle,
      chapterTitle,
      qpTarget: paperChipIdFromPaper(hit.paper, "qp"),
      msTarget: paperChipIdFromPaper(hit.paper, "ms"),
      tags,
      searchText: normaliseSearchText(searchBody),
      tokens: searchTokens(searchBody)
    };
  });
}

async function buildQuestionPdf(body = {}) {
  const requestedIds = Array.isArray(body.questionIds) ? body.questionIds.map(String) : [];
  const includeMarkScheme = body.includeMarkScheme !== false;
  const index = new Map(questionSearchIndex().map((question) => [question.id, question]));
  const questions = requestedIds.map((id) => index.get(id)).filter(Boolean);
  if (!questions.length) throwHttpError("Select at least one indexed question.", 400);

  const title = `${String(body.query || "Custom").trim() || "Custom"} practice set`;
  const pdf = await buildOriginalSourcePdf(questions, includeMarkScheme);
  return {
    filename: `paperlens-${slugPart(title) || "custom-practice"}-questions.pdf`,
    content: await pdf.save()
  };
}

async function buildOriginalSourcePdf(questions, includeMarkScheme) {
  const outputPdf = await PDFDocument.create();

  const appended = new Set();
  for (const question of questions) {
    await appendQuestionSource(outputPdf, question, "qp", appended);
  }

  if (includeMarkScheme) {
    for (const question of questions) {
      await appendQuestionSource(outputPdf, question, "ms", appended);
    }
  }

  return outputPdf;
}

async function appendQuestionSource(outputPdf, question, type, appended) {
  const sourcePath = localPaperPathForQuestion(question, type);
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    throwHttpError(`Original ${type.toUpperCase()} PDF is missing for ${question.source}.`, 404);
  }

  const sourceBytes = fs.readFileSync(sourcePath);
  const sourcePdf = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
  const pageCount = sourcePdf.getPageCount();
  const segments = await sourceSegmentsForQuestion(question, type, sourcePath, pageCount);
  const key = `${type}:${sourcePath}:${JSON.stringify(segments)}`;
  if (appended.has(key)) return;
  appended.add(key);

  const copiedPages = await outputPdf.copyPages(sourcePdf, segments.map((segment) => segment.page - 1));
  copiedPages.forEach((page, index) => {
    applyPageCrop(page, segments[index].crop);
    outputPdf.addPage(page);
  });
}

async function sourceSegmentsForQuestion(question, type, sourcePath, pageCount) {
  const explicitPages = type === "ms" ? question.msPages : question.qpPages;
  const explicitCrop = sourceCropForQuestion(question, type);
  const pages = normalisePageList(explicitPages, pageCount);
  if (pages.length && explicitCrop) return pages.map((page) => ({ page, crop: explicitCrop }));

  const geometry = await parsedPdfGeometry(sourcePath);
  const selectors = questionSelectorsFromRef(question.ref);
  const segments = selectors.flatMap((selector) => segmentsForSelector(geometry, selector, type));
  const unique = new Map();
  segments.forEach((segment) => unique.set(`${segment.page}:${JSON.stringify(segment.crop)}`, segment));
  if (unique.size) return [...unique.values()];

  throwHttpError(`Could not locate the exact ${type.toUpperCase()} region for ${question.source}.`, 422);
}

async function parsedPdfGeometry(sourcePath) {
  if (!PDFParse) {
    throwHttpError("Exact original-paper extraction is unavailable in this deployment.", 503);
  }

  if (parsedPdfGeometryCache.has(sourcePath)) return parsedPdfGeometryCache.get(sourcePath);
  const parser = new PDFParse({ data: fs.readFileSync(sourcePath) });
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
          text: item.str.trim(),
          x: Number(item.transform[4]),
          y: Number(item.transform[5]),
          width: Number(item.width || 0),
          height: Math.max(8, Math.abs(Number(item.height || item.transform[3] || 10)))
        }));
      pages.push({ page: pageNumber, width: viewport.width, height: viewport.height, items });
      page.cleanup();
    }
    parsedPdfGeometryCache.set(sourcePath, pages);
    return pages;
  } finally {
    await parser.destroy();
  }
}

function questionSelectorsFromRef(ref) {
  const value = String(ref || "").trim();
  if (!value || !/Q\d+/i.test(value)) return [];

  if (value.includes(",")) {
    return [...value.matchAll(/Q(\d+)(?:\(([a-z])\))?/gi)].map((match) => ({
      question: Number(match[1]),
      endQuestion: Number(match[1]),
      startPart: match[2]?.toLowerCase() || null,
      endPart: match[2]?.toLowerCase() || null
    }));
  }

  const partRange = value.match(/Q(\d+)\(([a-z])\)\s*-\s*(\d+)\(([a-z])\)/i);
  if (partRange) {
    return [{
      question: Number(partRange[1]),
      endQuestion: Number(partRange[3]),
      startPart: partRange[2].toLowerCase(),
      endPart: partRange[4].toLowerCase()
    }];
  }

  const questionRange = value.match(/Q(\d+)\s*-\s*(\d+)/i);
  if (questionRange) {
    return [{ question: Number(questionRange[1]), endQuestion: Number(questionRange[2]), startPart: null, endPart: null }];
  }

  const single = value.match(/Q(\d+)(?:\(([a-z])\))?/i);
  return single
    ? [{
        question: Number(single[1]),
        endQuestion: Number(single[1]),
        startPart: single[2]?.toLowerCase() || null,
        endPart: single[2]?.toLowerCase() || null
      }]
    : [];
}

function segmentsForSelector(geometry, selector, type) {
  const start = selectorStartMarker(geometry, selector, type);
  if (!start) return [];
  const end = selectorEndMarker(geometry, selector, type);
  const lastPage = end ? end.page : geometry[geometry.length - 1]?.page;
  const segments = [];

  for (let pageNumber = start.page; pageNumber <= lastPage; pageNumber += 1) {
    const page = geometry.find((candidate) => candidate.page === pageNumber);
    if (!page) continue;
    const xMargin = type === "ms" ? Math.max(42, page.width * 0.055) : Math.max(32, page.width * 0.05);
    const top = pageNumber === start.page ? Math.min(page.height - 24, start.y + start.height + 22) : page.height - 28;
    const endGap = type === "ms" ? 2 : 12;
    const bottom = end && pageNumber === end.page ? Math.max(28, end.y + end.height + endGap) : 28;
    if (top - bottom < 24) continue;
    segments.push({
      page: pageNumber,
      crop: {
        x: xMargin,
        y: bottom,
        width: page.width - xMargin * 2,
        height: top - bottom
      }
    });
  }
  return segments;
}

function selectorStartMarker(geometry, selector, type) {
  if (selector.startPart && selector.startPart !== "a") {
    const marker = findPartMarker(geometry, selector.question, selector.startPart, type);
    if (marker) return marker;
  }
  return findQuestionMarker(geometry, selector.question, type);
}

function selectorEndMarker(geometry, selector, type) {
  if (selector.endPart) {
    const nextPart = String.fromCharCode(selector.endPart.charCodeAt(0) + 1);
    const partMarker = findPartMarker(geometry, selector.endQuestion, nextPart, type);
    if (partMarker) return type === "ms" ? markSchemeSectionBoundary(geometry, partMarker) : partMarker;
  }
  const nextQuestion = findQuestionMarker(geometry, selector.endQuestion + 1, type);
  return type === "ms" && nextQuestion ? markSchemeSectionBoundary(geometry, nextQuestion) : nextQuestion;
}

function markSchemeSectionBoundary(geometry, marker) {
  const page = geometry.find((candidate) => candidate.page === marker.page);
  if (!page) return marker;
  const header = page.items
    .filter((item) => item.text === "Question" && item.x < page.width * 0.2 && item.y > marker.y && item.y - marker.y < 70)
    .sort((a, b) => a.y - b.y)[0];
  return header ? { page: marker.page, ...header } : marker;
}

function findQuestionMarker(geometry, questionNumber, type) {
  for (const page of geometry) {
    const candidates = page.items.filter((item) => {
      if (item.x >= page.width * 0.3 || item.y <= 42) return false;
      return type === "ms"
        ? new RegExp(`^${questionNumber}(?:\\([a-z]\\)|$)`, "i").test(item.text)
        : item.text === String(questionNumber);
    });
    if (candidates.length) {
      const item = candidates.sort((a, b) => b.y - a.y)[0];
      return { page: page.page, ...item };
    }
  }
  return null;
}

function findPartMarker(geometry, questionNumber, part, type) {
  const questionStart = findQuestionMarker(geometry, questionNumber, type);
  const questionEnd = findQuestionMarker(geometry, questionNumber + 1, type);
  if (!questionStart) return null;

  for (const page of geometry) {
    if (page.page < questionStart.page || (questionEnd && page.page > questionEnd.page)) continue;
    const candidates = page.items.filter((item) => {
      if (item.x >= page.width * 0.35 || item.y <= 36) return false;
      if (type === "ms") return new RegExp(`^${questionNumber}\\(${part}\\)`, "i").test(item.text);
      return item.text.toLowerCase() === `(${part})`;
    });
    for (const item of candidates.sort((a, b) => b.y - a.y)) {
      const position = { page: page.page, ...item };
      if (compareDocumentPosition(position, questionStart) >= 0 && (!questionEnd || compareDocumentPosition(position, questionEnd) < 0)) {
        return position;
      }
    }
  }
  return null;
}

function compareDocumentPosition(a, b) {
  if (a.page !== b.page) return a.page - b.page;
  return b.y - a.y;
}

async function buildQuestionPreview(question, type = "qp") {
  if (!canvasTools) {
    throwHttpError("Question image previews are unavailable in this deployment.", 503);
  }

  const cacheKey = `${type}:${question.id}`;
  if (questionPreviewCache.has(cacheKey)) return questionPreviewCache.get(cacheKey);
  const sourcePath = localPaperPathForQuestion(question, type);
  if (!sourcePath || !fs.existsSync(sourcePath)) throwHttpError(`Original ${type.toUpperCase()} PDF is missing for ${question.source}.`, 404);

  const geometry = await parsedPdfGeometry(sourcePath);
  const segments = await sourceSegmentsForQuestion(question, type, sourcePath, geometry.length);
  const pageNumbers = [...new Set(segments.map((segment) => segment.page))];
  const parser = new PDFParse({ data: fs.readFileSync(sourcePath) });
  try {
    const screenshots = await parser.getScreenshot({ partial: pageNumbers, desiredWidth: 1200, imageBuffer: true, imageDataUrl: false });
    const crops = [];
    for (const segment of segments) {
      const screenshot = screenshots.pages.find((page) => page.pageNumber === segment.page);
      const page = geometry.find((candidate) => candidate.page === segment.page);
      if (!screenshot || !page) continue;
      const scale = screenshot.width / page.width;
      const sx = Math.max(0, Math.round(segment.crop.x * scale));
      const sy = Math.max(0, Math.round((page.height - segment.crop.y - segment.crop.height) * scale));
      const sw = Math.min(screenshot.width - sx, Math.round(segment.crop.width * scale));
      const sh = Math.min(screenshot.height - sy, Math.round(segment.crop.height * scale));
      const image = await canvasTools.loadImage(Buffer.from(screenshot.data));
      crops.push({ image, sx, sy, sw, sh });
    }
    if (!crops.length) throwHttpError(`Could not render the original question for ${question.source}.`, 422);

    const gap = 18;
    const width = Math.max(...crops.map((crop) => crop.sw));
    const height = crops.reduce((total, crop) => total + crop.sh, 0) + gap * (crops.length - 1);
    const canvas = canvasTools.createCanvas(width, height);
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    let y = 0;
    crops.forEach((crop) => {
      context.drawImage(crop.image, crop.sx, crop.sy, crop.sw, crop.sh, 0, y, crop.sw, crop.sh);
      y += crop.sh + gap;
    });
    const output = canvas.toBuffer("image/png");
    questionPreviewCache.set(cacheKey, output);
    return output;
  } finally {
    await parser.destroy();
  }
}

function sourceCropForQuestion(question, type) {
  const crop = type === "ms" ? question.msCrop : question.qpCrop;
  if (!crop || typeof crop !== "object") return null;
  const { x, y, width, height } = crop;
  if (![x, y, width, height].every((value) => Number.isFinite(Number(value)))) return null;
  return {
    x: Number(x),
    y: Number(y),
    width: Number(width),
    height: Number(height)
  };
}

function normalisePageList(value, pageCount) {
  const rawPages = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(rawPages.map((page) => Number(page)).filter((page) => Number.isInteger(page) && page >= 1 && page <= pageCount))];
}

function applyPageCrop(page, crop) {
  if (typeof page.setCropBox === "function") page.setCropBox(crop.x, crop.y, crop.width, crop.height);
  if (typeof page.setMediaBox === "function") page.setMediaBox(crop.x, crop.y, crop.width, crop.height);
}

function questionId(hit, index) {
  return `${hit.paper}-${hit.ref || index}-${hit.section}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function syllabusSectionByCode(code) {
  for (const chapters of Object.values(data.syllabusChecklist)) {
    for (const chapter of chapters) {
      const section = chapter.sections.find((candidate) => candidate.code === code);
      if (section) return section;
    }
  }
  return null;
}

function syllabusChapterForSection(code) {
  for (const chapters of Object.values(data.syllabusChecklist)) {
    for (const chapter of chapters) {
      if (chapter.sections.some((section) => section.code === code)) return chapter;
    }
  }
  return null;
}

function paperChipIdFromPaper(paper, type) {
  const match = String(paper).match(/^0478\/(\d{2})\/(F\/M|M\/J|O\/N)\/(\d{2})$/);
  if (!match) return "";
  const [, component, season, year] = match;
  const seasonCode = { "F/M": "m", "M/J": "s", "O/N": "w" }[season];
  return `paper-chip-0478-${seasonCode}${year}-${type}-${component}`;
}

function localPaperPathForQuestion(question, type) {
  const parts = paperParts(question.paper);
  if (!parts) return "";
  const session = data.paperSessions.find(
    (candidate) => candidate.code === parts.seasonCode && String(candidate.year).slice(-2) === parts.year && candidate.components.includes(parts.component)
  );
  if (!session) return "";
  return path.join(rootDir, "textbook_syllabus", "pastpaper", localPastPaperFolder(session), localPaperFilename(session, type, parts.component));
}

function paperParts(paper) {
  const match = String(paper).match(/^0478\/(\d{2})\/(F\/M|M\/J|O\/N)\/(\d{2})$/);
  if (!match) return null;
  const [, component, season, year] = match;
  const seasonCode = { "F/M": "m", "M/J": "s", "O/N": "w" }[season];
  return { component, seasonCode, year };
}

function localPastPaperFolder(session) {
  const seasonFolder = session.season.replace("/", "-");
  const folder = `${session.year}-${seasonFolder}`;
  return session.year === 2020 && session.season === "May/June" ? `${folder} ` : folder;
}

function localPaperFilename(session, type, component) {
  return `0478_${session.code}${String(session.year).slice(-2)}_${type}_${component}.pdf`;
}

function extractSearchTerms(text) {
  const phrases = [
    "lossless",
    "lossy",
    "compression",
    "data storage",
    "file size",
    "two's complement",
    "sample rate",
    "sample resolution",
    "sql",
    "query",
    "trace table",
    "logic gate",
    "truth table"
  ];
  const lower = String(text).toLowerCase();
  const words = lower.match(/\b[a-z][a-z'-]{4,}\b/g) || [];
  return [...new Set([...phrases.filter((phrase) => lower.includes(phrase)), ...words.slice(0, 16)])];
}

function serveStatic(requestPath, res) {
  const publicPath = publicStaticPath(requestPath);
  if (!publicPath) {
    sendJson(res, { error: "Forbidden" }, 403);
    return;
  }

  const filePath = path.normalize(path.join(rootDir, publicPath));
  const rootWithSeparator = rootDir.endsWith(path.sep) ? rootDir : `${rootDir}${path.sep}`;
  if (filePath !== rootDir && !filePath.startsWith(rootWithSeparator)) {
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

function publicStaticPath(requestPath) {
  let cleanPath = "";
  try {
    cleanPath = decodeURIComponent(String(requestPath).split("?")[0]);
  } catch {
    return "";
  }

  if (cleanPath.includes("\0")) return "";
  const relativePath = path.posix.normalize(cleanPath === "/" ? "index.html" : cleanPath.replace(/^\/+/, ""));
  if (!relativePath || relativePath.startsWith("../") || relativePath === ".." || path.posix.isAbsolute(relativePath)) return "";
  if (publicStaticFiles.has(relativePath)) return relativePath;
  if (/^textbook_syllabus\/pastpaper\/.+\.pdf$/i.test(relativePath)) return relativePath;
  return "";
}

function ensureUserDatabase() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(usersDbPath)) {
    fs.writeFileSync(usersDbPath, JSON.stringify({ users: [] }, null, 2));
  }
  if (!fs.existsSync(checkoutDbPath)) {
    fs.writeFileSync(checkoutDbPath, JSON.stringify({ sessions: [] }, null, 2));
  }
}

async function readUsersDb() {
  if (useRemoteStore) return readRemoteJson(usersStoreKey, { users: [] }, normaliseUsersDb);

  ensureUserDatabase();
  try {
    const db = JSON.parse(fs.readFileSync(usersDbPath, "utf8"));
    return normaliseUsersDb(db);
  } catch {
    return { users: [] };
  }
}

async function writeUsersDb(db) {
  const safeDb = normaliseUsersDb(db);
  if (useRemoteStore) {
    await writeRemoteJson(usersStoreKey, safeDb);
    return;
  }

  ensureUserDatabase();
  fs.writeFileSync(usersDbPath, JSON.stringify(safeDb, null, 2));
}

async function readCheckoutDb() {
  if (useRemoteStore) return readRemoteJson(checkoutStoreKey, { sessions: [] }, normaliseCheckoutDb);

  ensureUserDatabase();
  try {
    const db = JSON.parse(fs.readFileSync(checkoutDbPath, "utf8"));
    return normaliseCheckoutDb(db);
  } catch {
    return { sessions: [] };
  }
}

async function writeCheckoutDb(db) {
  const safeDb = normaliseCheckoutDb(db);
  if (useRemoteStore) {
    await writeRemoteJson(checkoutStoreKey, safeDb);
    return;
  }

  ensureUserDatabase();
  fs.writeFileSync(checkoutDbPath, JSON.stringify(safeDb, null, 2));
}

function normaliseUsersDb(db) {
  return { users: Array.isArray(db?.users) ? db.users : [] };
}

function normaliseCheckoutDb(db) {
  return { sessions: Array.isArray(db?.sessions) ? db.sessions : [] };
}

async function readRemoteJson(key, fallback, normalise) {
  const value = await redisCommand(["GET", key]);
  if (!value) return fallback;

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return normalise(parsed);
  } catch {
    return fallback;
  }
}

async function writeRemoteJson(key, value) {
  await redisCommand(["SET", key, JSON.stringify(value)]);
}

async function redisCommand(command) {
  const response = await fetch(redisRestUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${redisRestToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) {
    throwHttpError(payload.error || "Remote database request failed.", 502);
  }
  return payload.result;
}

function normaliseEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(email);
}

function isStrongPassword(password) {
  return typeof password === "string" && password.length >= 8 && /[a-z]/i.test(password) && /\d/.test(password);
}

async function findUserByEmail(email) {
  const db = await readUsersDb();
  return db.users.find((user) => user.email === email) || null;
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    username: `${user.firstName} ${user.lastName}`.trim(),
    purchased: Boolean(user.purchased)
  };
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return { salt, hash };
}

async function enforceRateLimit(req, url) {
  const config = rateLimitConfig(url.pathname);
  if (!config) return;

  if (useRemoteStore) {
    await enforceRemoteRateLimit(req, config);
    return;
  }

  const now = Date.now();
  const key = `${config.name}:${clientAddress(req)}`;
  const bucket = rateLimitBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > config.limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    const error = new Error("Too many requests. Try again later.");
    error.status = 429;
    error.retryAfter = retryAfter;
    throw error;
  }
}

async function enforceRemoteRateLimit(req, config) {
  const windowSeconds = Math.ceil(config.windowMs / 1000);
  const windowId = Math.floor(Date.now() / config.windowMs);
  const key = `paperlens:rate:${config.name}:${clientAddress(req)}:${windowId}`;
  const count = Number(await redisCommand(["INCR", key]));
  if (count === 1) await redisCommand(["EXPIRE", key, windowSeconds]);
  if (count > config.limit) {
    const error = new Error("Too many requests. Try again later.");
    error.status = 429;
    error.retryAfter = windowSeconds;
    throw error;
  }
}

function rateLimitConfig(pathname) {
  if (pathname.startsWith("/api/auth/")) return { name: "auth", limit: 30, windowMs: 60_000 };
  if (pathname.startsWith("/api/billing/")) return { name: "billing", limit: 60, windowMs: 60_000 };
  if (pathname === "/api/question-search") return { name: "question-search", limit: 30, windowMs: 60_000 };
  return null;
}

function clientAddress(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
}

function assertTrustedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) throwHttpError("Missing Origin header.", 403);

  let originUrl;
  try {
    originUrl = new URL(origin);
  } catch {
    throwHttpError("Invalid Origin header.", 403);
  }

  if (originUrl.origin !== requestOrigin(req)) {
    throwHttpError("Request origin is not allowed.", 403);
  }
}

function requestOrigin(req) {
  const protocol = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() || (req.socket?.encrypted ? "https" : "http");
  const hostHeader = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  return `${protocol}://${hostHeader}`;
}

function createSessionToken(userId) {
  const payload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + sessionMaxAgeSeconds
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", sessionSecret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token) {
  const [encodedPayload, signature] = String(token || "").split(".");
  if (!encodedPayload || !signature) return null;

  const expected = crypto.createHmac("sha256", sessionSecret).update(encodedPayload).digest("base64url");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (!payload.userId || Number(payload.exp) <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function cookieHeaderValue(name, value, req, options = {}) {
  const parts = [
    `${name}=${value}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax"
  ];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (isSecureRequest(req)) parts.push("Secure");
  return parts.join("; ");
}

function setSessionCookie(res, userId, req) {
  res.setHeader(
    "Set-Cookie",
    cookieHeaderValue(sessionCookieName, createSessionToken(userId), req, { maxAge: sessionMaxAgeSeconds })
  );
}

function clearSessionCookie(res, req) {
  res.setHeader("Set-Cookie", cookieHeaderValue(sessionCookieName, "", req, { maxAge: 0 }));
}

function isSecureRequest(req) {
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim().toLowerCase();
  return forwardedProto === "https" || Boolean(req.socket?.encrypted);
}

function parseCookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const separator = cookie.indexOf("=");
        if (separator === -1) return [cookie, ""];
        return [cookie.slice(0, separator), cookie.slice(separator + 1)];
      })
  );
}

async function optionalAuthenticatedUser(req) {
  const token = parseCookies(req)[sessionCookieName];
  const session = verifySessionToken(token);
  if (!session) return null;

  const db = await readUsersDb();
  return db.users.find((user) => user.id === session.userId) || null;
}

async function requireAuthenticatedUser(req) {
  const user = await optionalAuthenticatedUser(req);
  if (!user) throwHttpError("Log in to continue.", 401);
  return user;
}

async function createUser(body) {
  const email = normaliseEmail(body.email);
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const password = String(body.password || "");

  if (!isValidEmail(email)) throwHttpError("Enter a valid email address.", 400);
  if (!firstName || !lastName) throwHttpError("Enter both first name and last name.", 400);
  if (!isStrongPassword(password)) throwHttpError("Password must be at least 8 characters and include letters and numbers.", 400);

  const db = await readUsersDb();
  if (db.users.some((user) => user.email === email)) {
    throwHttpError("This email is already registered.", 409);
  }

  const passwordData = hashPassword(password);
  const user = {
    id: crypto.randomUUID(),
    email,
    firstName,
    lastName,
    passwordHash: passwordData.hash,
    passwordSalt: passwordData.salt,
    purchased: false,
    questionFinderSearches: [],
    createdAt: new Date().toISOString()
  };

  db.users.push(user);
  await writeUsersDb(db);
  return { ok: true, user: publicUser(user) };
}

async function loginUser(body) {
  const email = normaliseEmail(body.email);
  const password = String(body.password || "");
  const user = await findUserByEmail(email);

  if (!user) throwHttpError("No account exists for this email.", 404);
  const passwordData = hashPassword(password, user.passwordSalt);
  if (passwordData.hash !== user.passwordHash) {
    throwHttpError("Incorrect password.", 401);
  }

  return { ok: true, user: publicUser(user) };
}

async function createCheckoutSession(user, req) {
  if (user.purchased) {
    return { ok: true, alreadyPurchased: true, user: publicUser(user) };
  }

  const sessionId = crypto.randomUUID();
  const checkout = await createStripeCheckoutSession(sessionId, user, req);
  const checkoutDb = await readCheckoutDb();
  checkoutDb.sessions.push({
    id: sessionId,
    userId: user.id,
    email: user.email,
    amount: lifetimeAccessPriceCny,
    currency: "CNY",
    status: "pending",
    checkoutUrl: checkout.url,
    provider: "stripe",
    providerSessionId: checkout.providerSessionId,
    createdAt: new Date().toISOString()
  });
  await writeCheckoutDb(checkoutDb);

  return {
    ok: true,
    checkoutUrl: checkout.url,
    sessionId,
    amount: lifetimeAccessPriceCny,
    currency: "CNY",
    providerSessionId: checkout.providerSessionId,
    status: "pending"
  };
}

async function createStripeCheckoutSession(sessionId, user, req) {
  if (useMockStripeCheckout) {
    return {
      url: `${checkoutBaseUrl(req)}/checkout.html?session=${encodeURIComponent(sessionId)}`,
      providerSessionId: `cs_test_${sessionId.replace(/-/g, "")}`
    };
  }

  if (!stripeSecretKey || !stripePriceId) {
    throwHttpError("Stripe Checkout is not configured.", 503);
  }

  const baseUrl = checkoutBaseUrl(req);
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("client_reference_id", sessionId);
  form.set("success_url", `${baseUrl}/checkout.html?session=${encodeURIComponent(sessionId)}&stripe_session_id={CHECKOUT_SESSION_ID}`);
  form.set("cancel_url", `${baseUrl}/index.html?buy=1#igcse-0478`);
  form.set("customer_email", user.email);
  form.set("line_items[0][price]", stripePriceId);
  form.set("line_items[0][quantity]", "1");
  form.set("metadata[paperlensCheckoutSessionId]", sessionId);
  form.set("payment_intent_data[metadata][paperlensCheckoutSessionId]", sessionId);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form.toString()
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.url || !payload.id) {
    throwHttpError(payload.error?.message || "Stripe Checkout session creation failed.", 502);
  }

  return {
    url: payload.url,
    providerSessionId: payload.id
  };
}

function checkoutBaseUrl(req) {
  return publicBaseUrl || requestOrigin(req);
}

async function checkoutSessionStatus(sessionId, authenticatedUser) {
  const checkoutDb = await readCheckoutDb();
  const session = checkoutDb.sessions.find((candidate) => candidate.id === String(sessionId || "").trim());
  if (!session) throwHttpError("Checkout session not found.", 404);
  if (session.userId !== authenticatedUser.id) throwHttpError("Checkout session does not belong to this account.", 403);
  const usersDb = await readUsersDb();
  const user = usersDb.users.find((candidate) => candidate.id === authenticatedUser.id);
  if (!user) throwHttpError("Session user not found.", 404);
  return {
    ok: true,
    status: session.status,
    paid: session.status === "paid",
    amount: session.amount,
    currency: session.currency,
    user: publicUser(user)
  };
}

async function markCheckoutSessionPaid(sessionId, providerEvent) {
  const checkoutDb = await readCheckoutDb();
  const session = checkoutDb.sessions.find((candidate) => candidate.id === String(sessionId || "").trim());

  if (!session) throwHttpError("Checkout session not found.", 404);
  if (session.status === "paid") {
    return { ok: true, alreadyPaid: true };
  }

  session.status = "paid";
  session.paidAt = new Date().toISOString();
  session.provider = providerEvent.provider;
  session.providerEventId = providerEvent.eventId;
  session.providerSessionId = providerEvent.providerSessionId || null;
  await writeCheckoutDb(checkoutDb);

  const usersDb = await readUsersDb();
  const user = usersDb.users.find((candidate) => candidate.id === session.userId);
  if (!user) throwHttpError("User for checkout session not found.", 404);
  user.purchased = true;
  user.purchasedAt = session.paidAt;
  user.checkoutSessionId = session.id;
  user.providerEventId = providerEvent.eventId;
  await writeUsersDb(usersDb);

  return { ok: true, user: publicUser(user) };
}

async function handleStripeWebhookEvent(event) {
  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded", "payment_intent.succeeded"].includes(event.type)) {
    return { ok: true, ignored: true };
  }

  const object = event.data?.object || {};
  if (event.type.startsWith("checkout.session") && object.payment_status && object.payment_status !== "paid") {
    return { ok: true, ignored: true };
  }

  const sessionId = object.metadata?.paperlensCheckoutSessionId || object.metadata?.checkoutSessionId || object.client_reference_id || "";
  if (!sessionId) throwHttpError("Stripe event is missing PaperLens checkout session metadata.", 400);

  return markCheckoutSessionPaid(sessionId, {
    provider: "stripe",
    eventId: event.id,
    providerSessionId: object.id || null
  });
}

function verifyStripeWebhookEvent(rawBody, signatureHeader) {
  if (!stripeWebhookSecret) throwHttpError("Stripe webhook secret is not configured.", 503);
  const signatures = parseStripeSignatureHeader(signatureHeader);
  const timestamp = Number(signatures.t?.[0]);
  const expectedSignatures = signatures.v1 || [];
  if (!Number.isFinite(timestamp) || !expectedSignatures.length) throwHttpError("Invalid Stripe webhook signature.", 400);
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > stripeWebhookToleranceSeconds) {
    throwHttpError("Stripe webhook signature timestamp is outside tolerance.", 400);
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", stripeWebhookSecret).update(signedPayload).digest("hex");
  const verified = expectedSignatures.some((signature) => timingSafeStringEqual(signature, expected));
  if (!verified) throwHttpError("Invalid Stripe webhook signature.", 400);

  try {
    return JSON.parse(rawBody);
  } catch {
    throwHttpError("Invalid Stripe webhook payload.", 400);
  }
}

function parseStripeSignatureHeader(header) {
  return String(header || "")
    .split(",")
    .map((part) => part.split("="))
    .reduce((result, [key, value]) => {
      if (!key || !value) return result;
      result[key] = result[key] || [];
      result[key].push(value);
      return result;
    }, {});
}

function timingSafeStringEqual(a, b) {
  const aBuffer = Buffer.from(String(a));
  const bBuffer = Buffer.from(String(b));
  return aBuffer.length === bBuffer.length && crypto.timingSafeEqual(aBuffer, bBuffer);
}

function throwHttpError(message, status) {
  const error = new Error(message);
  error.status = status;
  throw error;
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

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
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
