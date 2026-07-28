const fs = require("node:fs");
const http = require("node:http");
const crypto = require("node:crypto");
const path = require("node:path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const sharedData = require("./public/assets/paperlens-data");
const userStore = require("./src/server/users");
const sessionStore = require("./src/server/sessions");
const purchaseStore = require("./src/server/purchases");
const questionSearchStore = require("./src/server/questionSearches");

const rootDir = __dirname;
const publicDir = path.join(rootDir, "public");
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(rootDir, "data");
const usersDbPath = path.join(dataDir, "users.json");
const checkoutDbPath = path.join(dataDir, "checkout-sessions.json");
const redisRestUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const redisRestToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const useRemoteStore = Boolean(redisRestUrl && redisRestToken);
const usersStoreKey = process.env.PAPERLENS_USERS_KEY || "paperlens:users";
const checkoutStoreKey = process.env.PAPERLENS_CHECKOUT_KEY || "paperlens:checkout-sessions";
const syllabusPaperConfigs = {
  "caie-igcse-0478": {
    subjectCode: "0478",
    folder: "caie-igcse-0478",
    seasonFolderStyle: "hyphen"
  },
  "caie-as-a-level-9618": {
    subjectCode: "9618",
    folder: "caie-as-a-level-9618",
    seasonFolderStyle: "space"
  }
};
const lifetimeAccessPriceCny = 20;
const questionFinderTrialLimit = 2;
const sessionCookieName = "paperlens_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;
const isProduction = process.env.NODE_ENV === "production";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripePriceId = process.env.STRIPE_PRICE_ID || "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const stripeWebhookToleranceSeconds = 300;
const useMockStripeCheckout = process.env.STRIPE_CHECKOUT_MOCK === "1" && !isProduction;
const openaiApiKey = process.env.OPENAI_API_KEY || "";
const openaiGradingModel = process.env.OPENAI_GRADING_MODEL || "gpt-4.1-mini";
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
  "assets/paperlens-data.js",
  "assets/question-index.json",
  "app.js",
  "auth.js",
  "checkout.js",
  "styles.css",
  "auth.css",
  "assets/study-workspace.png"
]);

assertProductionConfiguration();

const data = loadAppData();
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
      const user = await optionalAuthenticatedUser(req);
      if (user) assertTrustedOrigin(req);
      sendJson(res, await searchQuestionFinder(body, user));
      return;
    }

    if (url.pathname === "/api/question-preview" && req.method === "GET") {
      const question = questionById(url.searchParams.get("id") || "");
      if (!question) throwHttpError("Question not found.", 404);
      const type = url.searchParams.get("type") === "ms" ? "ms" : "qp";
      await assertQuestionPreviewAccess(question.id, await requireAuthenticatedUser(req));
      const sourceUrl = originalSourceUrl(question, type);
      if (!sourceUrl) throwHttpError("Original source reference is unavailable.", 404);
      res.writeHead(302, { Location: sourceUrl, "Cache-Control": "private, max-age=300" });
      res.end();
      return;
    }

    if (url.pathname === "/api/grade-answer" && req.method === "POST") {
      const body = await readJsonBody(req);
      const user = await requireAuthenticatedUser(req);
      assertTrustedOrigin(req);
      sendJson(res, await gradeQuestionAnswer(body, user));
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
      await setSessionCookie(res, result.user.id, req);
      sendJson(res, result, 201);
      return;
    }

    if (url.pathname === "/api/auth/login" && req.method === "POST") {
      const body = await readJsonBody(req);
      const result = await loginUser(body);
      await setSessionCookie(res, result.user.id, req);
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
      await revokeCurrentSession(req);
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
  const productionEntries = loadProductionWebEntries();
  const appData = {
    topicBank: sharedData.topicBank,
    sourceLibrary: sharedData.sourceLibrary,
    syllabusChecklists: sharedData.syllabusChecklists,
    syllabusChecklist: sharedData.syllabusChecklist,
    chapterOneSections: sharedData.chapterOneSections,
    paperSessions: sharedData.paperSessions,
    pastPaperQuestionBank: productionEntries
  };
  return appData;
}

function loadProductionWebEntries() {
  const indexPath = path.join(rootDir, "generated", "production-question-index.json");
  if (!fs.existsSync(indexPath)) throw new Error("Production website index is missing. Run npm run build:question-index.");
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  if (index.dataSource !== "PRODUCTION_CANONICAL" || !Array.isArray(index.entries)) {
    throw new Error("Website question index is not sourced from production canonical data.");
  }
  return index.entries;
}

function canonicalDisplayText(value) {
  return String(value || "")
    .replace(/[\u0000-\u001f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function assertProductionConfiguration() {
  if (!isProduction) return;

  const missing = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!process.env.SESSION_SECRET) missing.push("SESSION_SECRET");

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

  const searches = await questionFinderSearches(user);
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

async function searchQuestionFinder(body = {}, user = null) {
  const query = String(body.query || "").trim();
  const syllabusIds = normaliseSyllabusIds(body.syllabusIds);
  if (!query) throwHttpError("Enter a knowledge point.", 400);
  if (!syllabusIds.length) throwHttpError("Select at least one syllabus.", 400);

  const matches = findQuestionMatches(query, syllabusIds).slice(0, 120);

  if (!user) {
    return {
      matches,
      trialConsumed: false,
      searchId: null,
      access: await questionFinderAccess(null)
    };
  }

  const dbUser = await userStore.findUserById(user.id);
  if (!dbUser) throwHttpError("Log in to use your two free Question Finder searches.", 401);

  const key = questionFinderSearchKey(query, syllabusIds);
  const searches = await questionFinderSearches(dbUser);
  const existing = searches.find((search) => search.key === key);

  if (!matches.length) {
    return {
      matches: [],
      trialConsumed: false,
      searchId: null,
      access: await questionFinderAccessForUser(dbUser)
    };
  }

  if (!dbUser.purchased && !existing && searches.length >= questionFinderTrialLimit) {
    throwHttpError("Your two free Question Finder searches are complete. Buy access for unlimited searches.", 402);
  }

  let search = existing;
  if (!dbUser.purchased && !search) {
    search = await questionSearchStore.createQuestionSearch({
      userId: dbUser.id,
      key,
      query: normaliseSearchText(query),
      syllabusIds,
      questionIds: matches.map((match) => match.id),
      resultCount: matches.length
    });
  }

  return {
    matches,
    trialConsumed: Boolean(!dbUser.purchased && !existing),
    searchId: search?.id || null,
    access: await questionFinderAccessForUser(dbUser)
  };
}

async function assertQuestionPdfAccess(body = {}, user) {
  if (user.purchased) return;

  const requestedIds = Array.isArray(body.questionIds) ? body.questionIds.map(String) : [];
  const allowedIds = new Set((await questionFinderSearches(user)).flatMap((search) => search.questionIds || []));
  if (!requestedIds.length || requestedIds.some((id) => !allowedIds.has(id))) {
    throwHttpError("These questions are not part of one of your free searches.", 403);
  }
}

async function assertQuestionPreviewAccess(questionId, user) {
  if (user.purchased) return;
  const allowedIds = new Set((await questionFinderSearches(user)).flatMap((search) => search.questionIds || []));
  if (!allowedIds.has(questionId)) throwHttpError("This question is not part of one of your free searches.", 403);
}

function questionById(id) {
  return questionSearchIndex().find((question) => question.id === id) || null;
}

async function gradeQuestionAnswer(body = {}, user) {
  if (!openaiApiKey) throwHttpError("AI grading is not configured. Set OPENAI_API_KEY on the server.", 503);

  const question = questionById(String(body.questionId || ""));
  const userAnswer = String(body.userAnswer || "").trim();
  if (!question) throwHttpError("Question not found.", 404);
  if (!userAnswer) throwHttpError("Enter your answer before checking it.", 400);
  if (userAnswer.length > 5000) throwHttpError("Answer is too long. Keep it under 5000 characters.", 400);

  await assertQuestionPreviewAccess(question.id, user);

  const part = normalisePracticePart(body.part);
  const maxScore = estimateQuestionMaxScore(question);
  const grading = await gradeWithOpenAI(question, userAnswer, maxScore, part);
  return {
    ok: true,
    questionId: question.id,
    source: question.source,
    knowledge: question.knowledge,
    sectionTitle: question.sectionTitle,
    grading
  };
}

function normalisePracticePart(part) {
  if (!part || typeof part !== "object") return null;
  return {
    label: String(part.label || "").slice(0, 40),
    prompt: canonicalDisplayText(part.prompt || "").slice(0, 1200),
    markScheme: String(part.markScheme || "").slice(0, 2000)
  };
}

function estimateQuestionMaxScore(question) {
  const answer = String(question.answer || "").replace(/^MS:\s*/i, "");
  const points = answer
    .split(/;|\n|(?:\.\s+)/)
    .map((point) => point.trim())
    .filter((point) => point.length >= 8);
  return Math.min(8, Math.max(1, points.length || 1));
}

async function gradeWithOpenAI(question, userAnswer, maxScore, part = null) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: openaiGradingModel,
      input: [
        {
          role: "system",
          content:
            "You are a strict but helpful CAIE IGCSE Computer Science examiner. Mark only against the supplied mark scheme. Award credit for equivalent wording, identify vague or incorrect statements, and keep feedback concise."
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Grade the student's answer against the mark scheme.",
            source: question.source,
            syllabusSection: question.sectionTitle,
            topic: question.knowledge,
            question: part?.prompt || question.question,
            subQuestion: part?.label || "",
            markScheme: part?.markScheme || question.answer,
            estimatedMaxScore: maxScore,
            studentAnswer: userAnswer
          })
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "paperlens_answer_grading",
          strict: true,
          schema: gradingSchema()
        }
      }
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throwHttpError(payload.error?.message || "AI grading request failed.", 502);
  }

  const text = responseOutputText(payload);
  if (!text) throwHttpError("AI grading returned an empty response.", 502);

  try {
    return normaliseGrading(JSON.parse(text), maxScore);
  } catch {
    throwHttpError("AI grading returned an invalid response.", 502);
  }
}

function gradingSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["score", "maxScore", "awardedPoints", "missedPoints", "issues", "feedback", "improvedAnswer"],
    properties: {
      score: { type: "number", minimum: 0 },
      maxScore: { type: "number", minimum: 1 },
      awardedPoints: {
        type: "array",
        items: { type: "string" }
      },
      missedPoints: {
        type: "array",
        items: { type: "string" }
      },
      issues: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["type", "comment"],
          properties: {
            type: {
              type: "string",
              enum: ["too vague", "missing keyword", "wrong concept", "not enough detail", "repeated point", "off task"]
            },
            comment: { type: "string" }
          }
        }
      },
      feedback: { type: "string" },
      improvedAnswer: { type: "string" }
    }
  };
}

function responseOutputText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return "";
}

function normaliseGrading(grading, fallbackMaxScore) {
  const maxScore = clampNumber(grading.maxScore, 1, 20, fallbackMaxScore);
  return {
    score: clampNumber(grading.score, 0, maxScore, 0),
    maxScore,
    awardedPoints: normaliseStringList(grading.awardedPoints),
    missedPoints: normaliseStringList(grading.missedPoints),
    issues: Array.isArray(grading.issues)
      ? grading.issues
          .map((issue) => ({
            type: String(issue?.type || "not enough detail"),
            comment: String(issue?.comment || "").trim()
          }))
          .filter((issue) => issue.comment)
          .slice(0, 6)
      : [],
    feedback: String(grading.feedback || "").trim(),
    improvedAnswer: String(grading.improvedAnswer || "").trim()
  };
}

function normaliseStringList(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 8)
    : [];
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

async function questionFinderSearches(user) {
  if (!user?.id) return [];
  return questionSearchStore.listQuestionSearches(user.id);
}

async function questionFinderAccessForUser(user) {
  const searches = await questionFinderSearches(user);
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

function normaliseSyllabusIds(value) {
  const supported = new Set(Object.keys(syllabusPaperConfigs));
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.map(String).filter((id) => supported.has(id)))];
}

function questionFinderSearchKey(query, syllabusIds) {
  return crypto.createHash("sha256").update(`${normaliseSearchText(query)}|${[...syllabusIds].sort().join(",")}`).digest("hex");
}

function findQuestionMatches(query, syllabusIds = Object.keys(syllabusPaperConfigs)) {
  const normalisedQuery = normaliseSearchText(query);
  const queryTokens = searchTokens(query);
  if (!normalisedQuery || !queryTokens.length) return [];

  const allowedSyllabuses = new Set(normaliseSyllabusIds(syllabusIds));
  return groupQuestionMatches(questionSearchIndex()
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
    .sort((a, b) => b.score - a.score || b.paper.localeCompare(a.paper)));
}

function questionSearchIndex() {
  return data.pastPaperQuestionBank.map((hit, index) => {
    const questionText = canonicalDisplayText(hit.question);
    const section = syllabusSectionByCode(hit.section);
    const chapter = syllabusChapterForSection(hit.section);
    const sectionTitle = section ? `${section.code} ${section.title}` : hit.section;
    const chapterTitle = chapter ? `${chapter.chapter}. ${chapter.title}` : "";
    const tags = extractSearchTerms(`${hit.knowledge} ${questionText} ${hit.answer} ${sectionTitle} ${chapterTitle}`);
    const source = hit.ref ? `${hit.paper} ${hit.ref}` : hit.paper;
    const searchBody = [hit.knowledge, questionText, hit.answer, sectionTitle, chapterTitle, tags.join(" ")].join(" ");

    return {
      ...hit,
      question: questionText,
      syllabusId: hit.syllabusId || paperParts(hit.paper)?.syllabusId || "caie-igcse-0478",
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

function groupQuestionMatches(matches) {
  const groups = new Map();

  for (const match of matches) {
    const key = questionGroupKey(match);
    const group = groups.get(key) || [];
    group.push(match);
    groups.set(key, group);
  }

  return [...groups.values()]
    .map((group) => mergeQuestionGroup(group))
    .sort((a, b) => b.score - a.score || b.paper.localeCompare(a.paper));
}

function questionGroupKey(question) {
  const questionNumber = String(question.ref || "").match(/Q\s*(\d+)/i)?.[1];
  return questionNumber ? `${question.paper}:Q${questionNumber}` : `${question.paper}:${question.ref || question.id}`;
}

function mergeQuestionGroup(group) {
  const sorted = [...group].sort((a, b) => b.score - a.score || a.index - b.index);
  const primary = sorted[0];
  const sectionTitles = uniqueValues(sorted.map((item) => item.sectionTitle));
  const chapterTitles = uniqueValues(sorted.map((item) => item.chapterTitle));
  const knowledgeLabels = uniqueValues(sorted.map((item) => item.knowledge));
  const questionTexts = uniqueValues(sorted.map((item) => item.question));
  const answerTexts = uniqueValues(sorted.map((item) => String(item.answer || "").replace(/^MS:\s*/i, "").trim()).filter(Boolean));

  return {
    ...primary,
    groupedIds: sorted.map((item) => item.id),
    groupSize: sorted.length,
    knowledge: knowledgeLabels.length > 1 ? `${knowledgeLabels.slice(0, 2).join(" + ")}${knowledgeLabels.length > 2 ? ` + ${knowledgeLabels.length - 2} more` : ""}` : primary.knowledge,
    question: questionTexts.join(" "),
    answer: answerTexts.length ? `MS: ${answerTexts.join("; ")}` : primary.answer,
    sectionTitle: sectionTitles.length > 1 ? `${sectionTitles.slice(0, 2).join(" + ")}${sectionTitles.length > 2 ? ` + ${sectionTitles.length - 2} more` : ""}` : primary.sectionTitle,
    chapterTitle: chapterTitles.length > 1 ? `${chapterTitles.slice(0, 2).join(" + ")}${chapterTitles.length > 2 ? ` + ${chapterTitles.length - 2} more` : ""}` : primary.chapterTitle,
    score: Math.max(...sorted.map((item) => item.score || 0)),
    isExact: sorted.some((item) => item.isExact),
    searchText: sorted.map((item) => item.searchText).join(" "),
    tokens: uniqueValues(sorted.flatMap((item) => item.tokens || []))
  };
}

function uniqueValues(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

async function buildQuestionPdf(body = {}) {
  const requestedIds = Array.isArray(body.questionIds) ? body.questionIds.map(String) : [];
  const includeMarkScheme = body.includeMarkScheme !== false;
  const index = new Map(questionSearchIndex().map((question) => [question.id, question]));
  const questions = requestedIds.map((id) => index.get(id)).filter(Boolean);
  if (!questions.length) throwHttpError("Select at least one indexed question.", 400);

  const title = `${String(body.query || "Custom").trim() || "Custom"} practice set`;
  const pdf = await PDFDocument.create();
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const writer = createCanonicalPdfWriter(pdf, regularFont, boldFont);

  writer.heading(title, 18);
  writer.paragraph("Generated from the production canonical question index.", 9, rgb(0.35, 0.35, 0.35));
  for (const [index, question] of questions.entries()) {
    writer.heading(`${index + 1}. ${question.source}`, 13);
    writer.paragraph(question.question, 11);
  }

  if (includeMarkScheme) {
    writer.pageBreak();
    writer.heading("Mark Scheme", 18);
    for (const [index, question] of questions.entries()) {
      writer.heading(`${index + 1}. ${question.source}`, 13);
      writer.paragraph(String(question.answer || "Mark scheme unavailable.").replace(/^MS:\s*/i, ""), 10);
    }
  }

  return {
    filename: `paperlens-${slugPart(title) || "custom-practice"}-questions.pdf`,
    content: await pdf.save()
  };
}

function createCanonicalPdfWriter(pdf, regularFont, boldFont) {
  const size = [595.28, 841.89];
  const margin = 48;
  const bottom = 48;
  let page;
  let y;

  function pageBreak() {
    page = pdf.addPage(size);
    y = size[1] - margin;
  }

  function ensureSpace(height) {
    if (!page || y - height < bottom) pageBreak();
  }

  function linesFor(text, font, fontSize, maxWidth) {
    const words = pdfSafeText(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = word;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }

  function write(text, font, fontSize, color, gap) {
    const lineHeight = fontSize * 1.38;
    for (const line of linesFor(text, font, fontSize, size[0] - margin * 2)) {
      ensureSpace(lineHeight);
      page.drawText(line, { x: margin, y, size: fontSize, font, color });
      y -= lineHeight;
    }
    y -= gap;
  }

  return {
    pageBreak,
    heading(text, fontSize = 13) {
      ensureSpace(fontSize * 2.2);
      write(text, boldFont, fontSize, rgb(0.08, 0.08, 0.08), fontSize * 0.65);
    },
    paragraph(text, fontSize = 10, color = rgb(0.12, 0.12, 0.12)) {
      write(canonicalDisplayText(text), regularFont, fontSize, color, fontSize);
    }
  };
}

function pdfSafeText(value) {
  return canonicalDisplayText(value)
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/×/g, "x")
    .replace(/÷/g, "/")
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .replace(/≠/g, "!=")
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/[^\x20-\x7E]/g, "?");
}

function originalSourceUrl(question, type) {
  const key = type === "ms" ? "markScheme" : "questionPaper";
  const reference = question?.sourceReferences?.[key];
  const url = String(reference?.url || "").trim();
  if (!url || !/^\/textbook_syllabus\/pastpaper\/.+\.pdf$/i.test(url)) return "";
  const page = Number(reference.pageStart || reference.pages?.[0]);
  return Number.isInteger(page) && page > 0 ? `${url}#page=${page}` : url;
}

function questionId(hit, index) {
  if (hit.canonicalQuestionId) return String(hit.canonicalQuestionId);
  return `${hit.paper}-${hit.ref || index}-${hit.section}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function syllabusSectionByCode(code) {
  for (const chapters of allSyllabusChapters()) {
    for (const chapter of chapters) {
      const section = chapter.sections.find((candidate) => candidate.code === code);
      if (section) return section;
    }
  }
  return null;
}

function syllabusChapterForSection(code) {
  for (const chapters of allSyllabusChapters()) {
    for (const chapter of chapters) {
      if (chapter.sections.some((section) => section.code === code)) return chapter;
    }
  }
  return null;
}

function allSyllabusChapters() {
  return Object.values(data.syllabusChecklists || {})
    .flatMap((syllabus) => Object.values(syllabus.papers || {}));
}

function paperChipIdFromPaper(paper, type) {
  const parts = paperParts(paper);
  if (!parts) return "";
  return `paper-chip-${parts.subjectCode}-${parts.seasonCode}${parts.year}-${type}-${parts.component}`;
}

function paperParts(paper) {
  const match = String(paper).match(/^(\d{4})\/(\d{2})\/(F\/M|M\/J|O\/N)\/(\d{2})$/);
  if (!match) return null;
  const [, subjectCode, component, season, year] = match;
  const syllabusId = Object.entries(syllabusPaperConfigs).find(([, config]) => config.subjectCode === subjectCode)?.[0] || "";
  if (!syllabusId) return null;
  const seasonCode = { "F/M": "m", "M/J": "s", "O/N": "w" }[season];
  return { subjectCode, component, season, seasonCode, year, fullYear: 2000 + Number(year), syllabusId };
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

  const baseDir = publicDir;
  const filePath = path.normalize(path.join(baseDir, publicPath));
  const baseWithSeparator = baseDir.endsWith(path.sep) ? baseDir : `${baseDir}${path.sep}`;
  if (filePath !== baseDir && !filePath.startsWith(baseWithSeparator)) {
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
  assertPersistentStoreConfigured();
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
  assertPersistentStoreConfigured();
  const safeDb = normaliseUsersDb(db);
  if (useRemoteStore) {
    await writeRemoteJson(usersStoreKey, safeDb);
    return;
  }

  ensureUserDatabase();
  fs.writeFileSync(usersDbPath, JSON.stringify(safeDb, null, 2));
}

async function readCheckoutDb() {
  assertPersistentStoreConfigured();
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
  assertPersistentStoreConfigured();
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

function assertPersistentStoreConfigured() {
  if (!isProduction || useRemoteStore) return;
  throwHttpError("Persistent storage is not configured. Set KV_REST_API_URL/KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN.", 503);
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
  return userStore.findUserByEmail(email);
}

function publicUser(user) {
  return userStore.publicUser(user);
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
  if (pathname === "/api/grade-answer") return { name: "grade-answer", limit: 12, windowMs: 60_000 };
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

function cookieHeaderValue(name, value, req, options = {}) {
  const parts = [
    `${name}=${value}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax"
  ];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (isProduction || isSecureRequest(req)) parts.push("Secure");
  return parts.join("; ");
}

async function setSessionCookie(res, userId, req) {
  const token = await sessionStore.createSession(userId, req, sessionMaxAgeSeconds);
  res.setHeader(
    "Set-Cookie",
    cookieHeaderValue(sessionCookieName, token, req, { maxAge: sessionMaxAgeSeconds })
  );
}

function clearSessionCookie(res, req) {
  res.setHeader("Set-Cookie", cookieHeaderValue(sessionCookieName, "", req, { maxAge: 0 }));
}

async function revokeCurrentSession(req) {
  await sessionStore.revokeSessionToken(parseCookies(req)[sessionCookieName]);
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
  return sessionStore.authenticatedUserFromToken(token);
}

async function requireAuthenticatedUser(req) {
  const user = await optionalAuthenticatedUser(req);
  if (!user) throwHttpError("Log in to continue.", 401);
  return user;
}

async function createUser(body) {
  return userStore.createUser(body);
}

async function loginUser(body) {
  return userStore.loginUser(body);
}

async function createCheckoutSession(user, req) {
  if (user.purchased) {
    return { ok: true, alreadyPurchased: true, user: publicUser(user) };
  }

  const sessionId = purchaseStore.createCheckoutId();
  const checkout = await createStripeCheckoutSession(sessionId, user, req);
  await purchaseStore.createPendingPurchase({
    id: sessionId,
    user,
    amount: lifetimeAccessPriceCny,
    currency: "CNY",
    checkoutUrl: checkout.url,
    stripeCheckoutSessionId: checkout.providerSessionId
  });

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

  assertStripeCheckoutConfigured();

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

function assertStripeCheckoutConfigured() {
  if (process.env.STRIPE_CHECKOUT_MOCK === "1" && isProduction) {
    throwHttpError("Stripe Checkout mock mode must be disabled in production.", 503);
  }
  if (!stripeSecretKey || !stripePriceId) {
    throwHttpError("Stripe Checkout is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID.", 503);
  }
}

async function checkoutSessionStatus(sessionId, authenticatedUser) {
  return purchaseStore.checkoutSessionStatus(sessionId, authenticatedUser);
}

async function markCheckoutSessionPaid(sessionId, providerEvent) {
  return purchaseStore.markCheckoutSessionPaid(sessionId, providerEvent);
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
    providerSessionId: object.id || null,
    paymentIntentId: object.payment_intent || null,
    customerId: object.customer || null
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
