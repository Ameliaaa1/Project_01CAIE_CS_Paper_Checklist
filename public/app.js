const paperLensData = globalThis.PaperLensData;
if (!paperLensData) {
  throw new Error("PaperLens shared data did not load. Ensure /assets/paperlens-data.js is served before /app.js.");
}

const {
  topicBank,
  sourceLibrary,
  syllabusChecklist,
  chapterOneSections,
  paperSessions,
  pastPaperQuestionBank
} = paperLensData;

const accessStorageKey = "paperlensAccess";
const previewRecentPaperSessions = 1;

const state = {
  docs: [],
  results: [],
  checklist: [],
  questionMatches: [],
  questionAccess: null,
  activePracticeQuestion: null,
  activePracticeParts: [],
  activePracticePartIndex: 0,
  activePracticeMode: "free",
  activeTemplateKeywords: [],
  auth: loadAccessState()
};

const $ = (id) => document.getElementById(id);

$("targetScore")?.addEventListener("input", (event) => {
  $("targetLabel").textContent = `${event.target.value}%`;
});

$("analyzeBtn")?.addEventListener("click", analyzeMaterials);
$("refreshAnalysis")?.addEventListener("click", analyzeMaterials);
$("paperFocus")?.addEventListener("change", analyzeMaterials);
$("generateQuestions")?.addEventListener("click", renderPractice);
$("exportMarkdown")?.addEventListener("click", () => download("paperlens-checklist.md", checklistMarkdown(), "text/markdown"));
$("exportCsv")?.addEventListener("click", () => download("paperlens-checklist.csv", checklistCsv(), "text/csv"));
$("exportJson")?.addEventListener("click", () => download("paperlens-checklist.json", JSON.stringify(state.checklist, null, 2), "application/json"));
$("expandChapter")?.addEventListener("click", () => setChapterDetails(true));
$("collapseChapter")?.addEventListener("click", () => setChapterDetails(false));
$("loginForm")?.addEventListener("submit", handleLoginSubmit);
$("purchaseButton")?.addEventListener("click", buyLifetimeAccess);
$("topbarBuyButton")?.addEventListener("click", buyLifetimeAccess);
$("logoutButton")?.addEventListener("click", logoutAccess);
$("purchaseCloseButton")?.addEventListener("click", closePurchaseModal);
$("createCheckoutButton")?.addEventListener("click", createCheckoutLink);
$("knowledgeSearch")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const bestMatch = (await renderKnowledgeSearchResults($("knowledgeSearchInput").value))[0];
  if (bestMatch) locateKnowledgePoint(bestMatch, $("knowledgeSearchInput").value);
});
$("knowledgeSearchInput")?.addEventListener("input", (event) => {
  renderKnowledgeSearchResults(event.target.value);
});
$("questionFinderSearch")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await renderQuestionFinderResults($("questionFinderInput")?.value || "");
});
$("questionFinderInput")?.addEventListener("input", (event) => {
  if (!event.target.value.trim()) renderQuestionFinderResults("");
});
document.querySelectorAll(".question-syllabus-input").forEach((input) => {
  input.addEventListener("change", () => {
    state.questionMatches = [];
    const results = $("questionFinderResults");
    if (results) results.innerHTML = `<p class="question-empty-state">Enter a knowledge point to search the selected syllabus.</p>`;
  });
});
$("questionFinderBuyButton")?.addEventListener("click", buyLifetimeAccess);
$("questionImageCloseButton")?.addEventListener("click", closeQuestionImageModal);
$("paperCloseButton")?.addEventListener("click", closePaperModal);
$("practiceCloseButton")?.addEventListener("click", closePracticeModal);
$("practiceForm")?.addEventListener("submit", submitPracticeAnswer);
$("practicePreviewButton")?.addEventListener("click", openActivePracticePreview);
$("practicePartList")?.addEventListener("click", handlePracticePartClick);
document.querySelectorAll("[data-practice-mode]").forEach((button) => {
  button.addEventListener("click", () => setPracticeMode(button.dataset.practiceMode || "free"));
});
$("questionImageModal")?.addEventListener("click", (event) => {
  if (event.target === event.currentTarget) closeQuestionImageModal();
});
$("paperModal")?.addEventListener("click", (event) => {
  if (event.target === event.currentTarget) closePaperModal();
});
$("practiceModal")?.addEventListener("click", (event) => {
  if (event.target === event.currentTarget) closePracticeModal();
});
document.addEventListener("click", handleQuestionPreviewClick);
document.addEventListener("click", handleQuestionPracticeClick);
document.addEventListener("error", handleQuestionPreviewImageError, true);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeQuestionImageModal();
    closePaperModal();
    closePracticeModal();
  }
});
document.querySelectorAll("[data-question-suggestion]").forEach((button) => {
  button.addEventListener("click", async () => {
    const input = $("questionFinderInput");
    if (!input) return;
    input.value = button.dataset.questionSuggestion;
    input.focus();
    await renderQuestionFinderResults(input.value);
  });
});

async function analyzeMaterials() {
  const apiResult = await analyzeMaterialsFromApi();
  if (apiResult) {
    state.docs = apiResult.docs;
    state.results = apiResult.results;
    state.checklist = apiResult.checklist;
    renderSummary(apiResult.summary.wordCount);
    renderTopics();
    renderChecklist();
    renderPractice(apiResult.practicePrompts);
    return;
  }

  analyzeMaterialsLocally();
}

async function analyzeMaterialsFromApi() {
  if (!window.location.protocol.startsWith("http") || !$("paperFocus") || !$("targetScore")) return null;
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paperFocus: $("paperFocus").value,
        manual: $("manualText")?.value.trim() || "",
        threshold: $("targetScore").value
      })
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function analyzeMaterialsLocally() {
  const paperFocus = $("paperFocus").value;
  const manual = $("manualText").value.trim();
  state.docs = sourceLibrary
    .filter((source) => source.paper === undefined || source.paper === "both" || paperFocus === "both" || source.paper === paperFocus)
    .map((source) => ({ ...source, kind: source.paper || "source" }));
  if (manual) {
    state.docs.push({ name: "Admin notes", kind: "manual", text: manual });
  }

  const paperText = state.docs.map((doc) => doc.text).join("\n");
  const syllabusText = sourceLibrary.map((doc) => doc.text).join("\n");
  const allText = state.docs.map((doc) => doc.text).join("\n");
  const totalSignals = countWords(allText);

  state.results = topicBank
    .map((topic) => scoreTopic(topic, paperText, syllabusText, allText))
    .sort((a, b) => b.priority - a.priority);

  state.checklist = buildChecklist(state.results);
  renderSummary(totalSignals);
  renderTopics();
  renderChecklist();
  renderPractice();
}

function renderPastPaperCatalogs() {
  renderPastPaperArchive("pastPaperArchive");
  applyAccessState();
}

function renderSyllabusChecklists() {
  renderSyllabusChecklist("paper1Checklist", syllabusChecklist.paper1);
  renderSyllabusChecklist("paper2Checklist", syllabusChecklist.paper2);
  applyAccessState();
}

function renderSyllabusChecklist(containerId, chapters) {
  const container = $(containerId);
  if (!container) return;

  container.innerHTML = chapters
    .map((chapter) => {
      const chapterStats = probabilityForChapter(chapter);
      const locked = isLockedChapter(chapter);
      return `
      <article class="syllabus-chapter ${locked ? "is-locked" : ""}" id="${chapterId(chapter.chapter)}" data-access-locked="${locked}">
        <h3>
          <span>${chapter.chapter}. ${chapter.title}</span>
          ${probabilityBadge(chapterStats)}
        </h3>
        ${chapterSectionList(chapter)}
      </article>
    `;
    })
    .join("");
}

function chapterSectionList(chapter) {
  return `
    <div class="syllabus-section-list">
      ${chapter.sections
        .map((section) => {
          const sectionStats = probabilityForSection(section);
          return `
          <section class="syllabus-section" id="${sectionId(section.code)}">
            <h4>
              <span>${section.code} ${section.title}</span>
              ${probabilityBadge(sectionStats)}
            </h4>
            ${sectionChecklist(section)}
            ${sectionVisual(section)}
            ${sectionExamQuestions(section)}
          </section>
        `;
        })
        .join("")}
    </div>
  `;
}

function loadAccessState() {
  try {
    const stored = JSON.parse(localStorage.getItem(accessStorageKey) || "{}");
    return {
      loggedIn: false,
      purchased: false,
      user: null,
      ...stored,
      purchased: false
    };
  } catch {
    return { loggedIn: false, purchased: false, user: null };
  }
}

function saveAccessState() {
  localStorage.setItem(accessStorageKey, JSON.stringify(state.auth));
}

function hasFullAccess() {
  return Boolean(state.auth.loggedIn && state.auth.purchased);
}

function isLockedChapter(chapter) {
  return !hasFullAccess() && String(chapter.chapter) !== "1";
}

function lockedOverlay(message) {
  return `
    <div class="locked-overlay" aria-hidden="true">
      <span class="lock-icon">Lock</span>
      <strong>Premium content</strong>
      <p>${message}</p>
    </div>
  `;
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const username = $("usernameInput")?.value.trim() || "";
  const email = $("emailInput")?.value.trim() || "";
  const password = $("passwordInput")?.value || "";

  if (!username || !email || password.length < 6) {
    updateLoginMessage("Please enter a username, valid email and at least 6 password characters.");
    return;
  }

  state.auth = {
    ...state.auth,
    loggedIn: true,
    user: { username, email }
  };
  saveAccessState();
  updateLoginMessage("Logged in. Buy lifetime access to unlock every checklist and paper.");
  applyAccessState();
}

function buyLifetimeAccess() {
  if (!state.auth.loggedIn) {
    window.location.href = "login.html?return=buy";
    return;
  }

  if (hasFullAccess()) return;
  openPurchaseModal();
}

async function logoutAccess() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
  } catch {}

  state.auth = { loggedIn: false, purchased: false, user: null };
  saveAccessState();
  $("loginForm")?.reset();
  updateLoginMessage("You are signed out. Preview mode is active.");
  refreshAccessControlledContent();
}

function updateLoginMessage(message) {
  const messageNode = $("loginMessage");
  if (messageNode) messageNode.textContent = message;
}

function openPurchaseModal() {
  const modal = $("purchaseModal");
  if (!modal) return;
  $("paymentLinkBox")?.setAttribute("hidden", "");
  updatePurchaseMessage("");
  modal.hidden = false;
}

function closePurchaseModal() {
  const modal = $("purchaseModal");
  if (modal) modal.hidden = true;
}

async function createCheckoutLink() {
  if (!state.auth.loggedIn) {
    window.location.href = "login.html?return=buy";
    return;
  }

  updatePurchaseMessage("Creating your payment link...");
  try {
    const response = await fetch("/api/billing/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 || response.status === 404) {
        state.auth = { loggedIn: false, purchased: false, user: null };
        saveAccessState();
        window.location.href = "login.html?return=buy";
        return;
      }
      updatePurchaseMessage(data.error || "Could not create payment link.");
      return;
    }
    if (data.alreadyPurchased && data.user) {
      state.auth = { ...state.auth, purchased: true, user: data.user };
      saveAccessState();
      refreshAccessControlledContent();
      closePurchaseModal();
      return;
    }

    const paymentLink = $("paymentLink");
    const paymentLinkBox = $("paymentLinkBox");
    if (paymentLink && paymentLinkBox) {
      paymentLink.href = data.checkoutUrl;
      paymentLink.textContent = data.checkoutUrl;
      paymentLinkBox.hidden = false;
    }
    updatePurchaseMessage("Open the checkout link to finish payment.");
  } catch {
    updatePurchaseMessage("Could not reach the checkout server.");
  }
}

function updatePurchaseMessage(message) {
  const messageNode = $("purchaseMessage");
  if (messageNode) messageNode.textContent = message;
}

function applyAccessState() {
  document.body.classList.toggle("has-full-access", hasFullAccess());
  document.body.classList.toggle("is-logged-in", state.auth.loggedIn);
  updateAccountUi();
  updateLockedContent();
}

function refreshAccessControlledContent() {
  renderPastPaperArchive("pastPaperArchive");
  renderSyllabusChecklist("paper1Checklist", syllabusChecklist.paper1);
  renderSyllabusChecklist("paper2Checklist", syllabusChecklist.paper2);
  applyAccessState();
  loadQuestionFinderAccess();
}

async function syncAuthStateFromServer() {
  try {
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    if (!response.ok) {
      state.auth = { loggedIn: false, purchased: false, user: null };
      saveAccessState();
      refreshAccessControlledContent();
      return;
    }
    const data = await response.json();
    state.auth = {
      ...state.auth,
      loggedIn: true,
      purchased: Boolean(data.user.purchased),
      user: data.user
    };
    saveAccessState();
    refreshAccessControlledContent();
    loadQuestionFinderAccess();
  } catch {
    updateAccountUi();
  }
}

function updateAccountUi() {
  const status = $("accountStatus");
  const buyButton = $("topbarBuyButton");
  const logoutButton = $("logoutButton");
  const purchaseButton = $("purchaseButton");
  const accessMeter = $("accessMeter");
  document.querySelectorAll(".auth-guest-action").forEach((action) => {
    const hideGuestAction = Boolean(state.auth.loggedIn);
    action.hidden = hideGuestAction;
    action.style.display = hideGuestAction ? "none" : "";
  });

  if (status) {
    if (hasFullAccess()) status.textContent = `Logged in: ${state.auth.user?.username || "User"} - Lifetime access`;
    else if (state.auth.loggedIn) status.textContent = `Logged in: ${state.auth.user?.username || "User"} - Buy access to unlock`;
    else status.textContent = "Guest preview";
  }

  if (buyButton) {
    const hideBuyButton = hasFullAccess();
    buyButton.hidden = hideBuyButton;
    buyButton.style.display = hideBuyButton ? "none" : "";
    buyButton.textContent = "Buy access";
  }
  if (logoutButton) {
    logoutButton.hidden = !state.auth.loggedIn;
    logoutButton.style.display = state.auth.loggedIn ? "" : "none";
  }
  if (purchaseButton) {
    purchaseButton.textContent = hasFullAccess() ? "Purchased" : "Buy lifetime access";
    purchaseButton.disabled = hasFullAccess();
  }
  if (accessMeter) {
    accessMeter.innerHTML = hasFullAccess()
      ? "<span>Lifetime access</span><strong>Everything unlocked</strong>"
      : state.auth.loggedIn
        ? "<span>Logged in preview</span><strong>Purchase required for full access</strong>"
        : "<span>Preview mode</span><strong>Partial content visible</strong>";
  }
}

function updateLockedContent() {
  document.querySelectorAll("[data-access-locked]").forEach((node) => {
    const locked = node.dataset.accessLocked === "true" && !hasFullAccess();
    node.classList.toggle("is-locked", locked);
    node.setAttribute("aria-disabled", String(locked));
  });
}

function openPurchaseModalFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("buy") !== "1") return;
  if (!state.auth.loggedIn) {
    window.location.href = "login.html?return=buy";
    return;
  }
  if (!hasFullAccess()) {
    window.requestAnimationFrame(openPurchaseModal);
  }
}

function slugPart(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function chapterId(chapter) {
  return `chapter-${slugPart(chapter)}`;
}

function sectionId(code) {
  return `section-${slugPart(code)}`;
}

function sectionChecklist(section) {
  if (!section.items?.length) return "";

  return `
    <ul class="key-checklist">
      ${section.items.map((item) => `<li>${highlightKeywords(item)}</li>`).join("")}
    </ul>
  `;
}

function paperDownloadTargetForSection(section) {
  return "past-paper-archive";
}

function sectionExamQuestions(section) {
  const hits = pastPaperQuestionBank.filter((hit) => hit.section === section.code);
  const groups = hits.map((hit) => ({
    title: hit.knowledge,
    answer: hit.answer,
    hits: [hit],
    patterns: mergePastPaperHits([hit], hit.knowledge, hit.answer, section)
  }));

  if (!groups.length) return "";

  return `
    <div class="section-exam-bank">
      <h5>Exam question pastpaper</h5>
      ${groups
        .map(
          (group) => `
          <article class="exam-question-group">
            <div class="exam-pattern-list">
              ${group.patterns
                .map(
                  (pattern) => `
                  <details class="exam-pattern">
                    <summary>
                      <span class="pattern-meta">
                        <a class="knowledge-tag" href="#${sectionId(section.code)}">${pattern.knowledge}</a>
                        ${pattern.sources
                          .map((source) => paperSourceTag(source, section))
                          .join("")}
                      </span>
                      <span class="pattern-question">${pattern.question}</span>
                    </summary>
                    ${patternAnswerMarkup(pattern.answer)}
                  </details>
                `
                )
                .join("")}
            </div>
          </article>
        `
        )
        .join("")}
    </div>
  `;
}

function patternAnswerMarkup(answer) {
  if (!answer.includes(";")) {
    return `<p class="pattern-answer">${highlightKeywords(answer)}</p>`;
  }

  const labelMatch = answer.match(/^\s*(MS(?:\s+terms)?):\s*/i);
  const label = labelMatch ? labelMatch[1] : "MS";
  const answerBody = labelMatch ? answer.slice(labelMatch[0].length) : answer;
  const points = answerBody
    .split(";")
    .map((point) => point.trim())
    .filter(Boolean);

  return `
    <div class="pattern-answer pattern-answer-points">
      <span class="answer-label">${label} points</span>
      <ul>
        ${points.map((point) => `<li>${highlightKeywords(point)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function mergePastPaperHits(hits, title, answer, section) {
  const merged = new Map();
  hits.forEach((hit) => {
    const key = normaliseExamIntent(hit.knowledge || title, hit.answer || answer);
    const existing = merged.get(key) || {
      knowledge: hit.knowledge || title,
      knowledgeHref: `#${sectionId(section.code)}`,
      sources: [],
      questions: [],
      answers: []
    };
    existing.sources.push(hit.ref ? `${hit.paper} ${hit.ref}`.trim() : hit.paper);
    existing.questions.push(hit.question);
    existing.answers.push(hit.answer || answer);
    merged.set(key, existing);
  });

  return Array.from(merged.values()).map((pattern) => ({
    ...pattern,
    sources: Array.from(new Set(pattern.sources)),
    question: mergedQuestionText(pattern.questions),
    answer: mergedAnswerText(pattern.answers)
  }));
}

function normaliseExamIntent(knowledge, answer) {
  const lower = `${knowledge} ${answer}`.toLowerCase();
  if (lower.includes("number systems")) return "number-systems";
  if (lower.includes("conversions")) return "conversions";
  if (lower.includes("binary") && (lower.includes("logic circuit") || lower.includes("0s and 1s") || lower.includes("two stable"))) {
    return "why-binary";
  }
  if (lower.includes("binary addition and overflow")) return "binary-addition-overflow";
  if (lower.includes("overflow definition")) return "overflow-definition";
  if (lower.includes("overflow")) return "overflow";
  if (lower.includes("logical shift")) return "logical-shift";
  return lower.replace(/[^a-z0-9]+/g, "-");
}

function mergedQuestionText(questions) {
  const cleaned = Array.from(new Set(questions.map((question) => question.trim())));
  return cleaned.length === 1 ? cleaned[0] : cleaned.join(" / ");
}

function mergedAnswerText(answers) {
  const cleaned = Array.from(new Set(answers.map((answer) => answer.trim())));
  return cleaned.join(" ");
}

function paperSourceTag(source, section) {
  const paper = sourcePaperFromLabel(source);
  const target = paper ? paperChipIdFromPaper(paper, "qp") : paperDownloadTargetForSection(section);
  const data = paper ? ` data-paper="${paper}"` : "";
  return `<a class="paper-source-tag" href="#${target}"${data}>${source}</a>`;
}

function sourcePaperFromLabel(source) {
  const match = source.match(/^0478\/\d{2}\/(?:F\/M|M\/J|O\/N)\/\d{2}/);
  return match ? match[0] : "";
}

function paperParts(paper) {
  const match = paper.match(/^0478\/(\d{2})\/(F\/M|M\/J|O\/N)\/(\d{2})$/);
  if (!match) return null;
  const [, component, season, year] = match;
  const seasonCode = { "F/M": "m", "M/J": "s", "O/N": "w" }[season];
  return { component, seasonCode, year };
}

function paperChipIdFromPaper(paper, type) {
  const parts = paperParts(paper);
  if (!parts) return "";
  return `paper-chip-0478-${parts.seasonCode}${parts.year}-${type}-${parts.component}`;
}

function paperSessionFromPaper(paper) {
  const parts = paperParts(paper);
  if (!parts) return null;
  const year = 2000 + Number(parts.year);
  const season = { m: "March", s: "May/June", w: "Oct/Nov" }[parts.seasonCode];
  return season ? { year, season, code: parts.seasonCode } : null;
}

function paperPdfUrl(session, type, component) {
  return `textbook_syllabus/pastpaper/${encodeURIComponent(localPastPaperFolder(session))}/${localPaperFilename(session, type, component)}`;
}

function paperPdfUrlForQuestion(question, type = "qp") {
  const parts = paperParts(question?.paper || question?.paperLabel || "");
  const session = paperSessionFromPaper(question?.paper || question?.paperLabel || "");
  if (!parts || !session || !hasLocalPaperFile(session, type, parts.component)) return "";
  return paperPdfUrl(session, type, parts.component);
}

function localPastPaperFolder(session) {
  const seasonFolder = session.season.replace("/", "-");
  const folder = `${session.year}-${seasonFolder}`;
  return session.year === 2020 && session.season === "May/June" ? `${folder} ` : folder;
}

function localPaperFilename(session, type, component) {
  return `0478_${session.code}${String(session.year).slice(-2)}_${type}_${component}.pdf`;
}

const missingLocalPastPaperFiles = new Set([
  "0478_s19_ms_11.pdf",
  "0478_s19_ms_12.pdf",
  "0478_s19_ms_13.pdf",
  "0478_w19_qp_13.pdf",
  "0478_w19_qp_21.pdf",
  "0478_w19_qp_22.pdf"
]);

function hasLocalPaperFile(session, type, component) {
  if (type === "pm") {
    return session.year === 2019 && ["s", "w"].includes(session.code) && component.startsWith("2");
  }

  return !missingLocalPastPaperFiles.has(localPaperFilename(session, type, component));
}

renderPastPaperCatalogs();
renderSyllabusChecklists();
renderChapterOne();
renderKnowledgeSearchResults("");
renderQuestionFinderResults("");
renderSidebarNav();
syncAuthStateFromServer();
loadQuestionFinderAccess();
document.querySelectorAll(".nav-toggle[data-href]").forEach((toggle) => {
  toggle.addEventListener("click", handleNavToggleClick);
});
document.addEventListener("click", handlePaperSourceClick);
document.addEventListener("click", handleAnchorClick);
window.addEventListener("load", () => {
  if (window.location.hash) scrollToAnchorTarget(window.location.hash, { behavior: "auto", updateHistory: false });
  openPurchaseModalFromUrl();
});
window.addEventListener("hashchange", () => {
  if (window.location.hash) scrollToAnchorTarget(window.location.hash, { behavior: "auto", updateHistory: false });
});

function handleAnchorClick(event) {
  const link = event.target.closest('a[href^="#"]');
  if (!link || link.classList.contains("paper-source-tag")) return;

  const target = targetFromHash(link.hash);
  if (!target) return;

  event.preventDefault();
  scrollToAnchorTarget(link.hash);
}

function handleNavToggleClick(event) {
  const toggle = event.currentTarget;
  event.preventDefault();
  const branch = toggle.closest(".nav-branch");
  const shouldOpen = branch ? !branch.classList.contains("is-open") : true;
  if (branch) branch.classList.toggle("is-open", shouldOpen);
  window.requestAnimationFrame(() => {
    scrollToAnchorTarget(toggle.dataset.href, { expandSidebar: shouldOpen });
  });
}

function targetFromHash(hash) {
  if (!hash || hash === "#") return null;

  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return document.getElementById(hash.slice(1));
  }
}

function scrollToAnchorTarget(hash, options = {}) {
  const target = targetFromHash(hash);
  if (!target) return;

  target.closest("details")?.setAttribute("open", "");
  if (options.expandSidebar !== false) openSidebarBranch(hash);
  const offset = anchorScrollOffset(target);
  const scrollContainer = target.closest(".page-content");
  if (scrollContainer) {
    const containerTop = scrollContainer.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top - containerTop + scrollContainer.scrollTop - offset;
    scrollContainer.scrollTo({ top: Math.max(targetTop, 0), behavior: options.behavior || "smooth" });
  } else {
    const targetTop = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(targetTop, 0), behavior: options.behavior || "smooth" });
  }

  if (options.updateHistory !== false && window.history.pushState) {
    window.history.pushState(null, "", hash);
  }
}

function anchorScrollOffset(target) {
  if (target.id === "question-finder") return 0;
  return Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--anchor-offset")) || 0;
}

function openSidebarBranch(hash) {
  const branch = [...document.querySelectorAll(".nav-branch")].find(
    (group) => group.querySelector(`[href="${hash}"]`) || group.querySelector(`.nav-toggle[data-href="${hash}"]`)
  );
  if (branch) {
    branch.classList.add("is-open");
    branch.closest(".checklist-nav-branch")?.classList.add("is-open");
  }
}

function renderSidebarNav() {
  const nav = $("sidebarNav");
  if (!nav) return;

  const paperGroups = [
    {
      title: "Paper 1: Theory",
      paperId: "paper-1",
      checklistId: "paper-1-checklist",
      chapters: syllabusChecklist.paper1
    },
    {
      title: "Paper 2: Algorithms and programming",
      paperId: "paper-2",
      checklistId: "paper-2-checklist",
      chapters: syllabusChecklist.paper2
    }
  ];

  nav.innerHTML = `
    <a class="nav-link level-0" href="#home">Home</a>
    <a class="nav-link level-0" href="#question-finder">Question finder</a>
    <a class="nav-link level-0" href="#igcse-0478">IGCSE 0478</a>
    <a class="nav-link level-1" href="#past-paper-archive">Past paper archive</a>
    ${paperGroups.map(sidebarPaperGroup).join("")}
  `;
}

function sidebarPaperGroup(group) {
  return `
    <a class="nav-link level-1" href="#${group.paperId}">${group.title}</a>
    <div class="nav-branch checklist-nav-branch">
      <button class="nav-link level-2 nav-toggle" type="button" data-href="#${group.checklistId}">Checklist</button>
      <div class="checklist-nav-children">
        ${group.chapters.map(sidebarChapterBranch).join("")}
      </div>
    </div>
  `;
}

function sidebarChapterBranch(chapter) {
  return `
    <div class="nav-branch">
      <button class="nav-link level-3 nav-toggle" type="button" data-href="#${chapterId(chapter.chapter)}">
        ${chapter.chapter}. ${chapter.title}
      </button>
      ${chapter.sections
        .map((section) => `<a class="nav-link level-4" href="#${sectionId(section.code)}">${section.code} ${section.title}</a>`)
        .join("")}
    </div>
  `;
}

function sectionKnowledgeItems(section) {
  return section.items;
}

function knowledgeSearchIndex() {
  const syllabusEntries = Object.entries(syllabusChecklist).flatMap(([paper, chapters]) =>
    chapters.flatMap((chapter) =>
      chapter.sections.flatMap((section) => {
        const context = `${paper === "paper1" ? "Paper 1 Theory" : "Paper 2 Algorithms"} · Chapter ${chapter.chapter}: ${chapter.title}`;
        const sectionTarget = sectionId(section.code);
        const sectionEntry = {
          title: `${section.code} ${section.title}`,
          context,
          body: `${chapter.title} ${section.title} ${section.items.join(" ")}`,
          targetId: sectionTarget,
          matchType: "section"
        };
        const itemEntries = section.items.map((item, index) => ({
          title: item.split(":")[0],
          context: `${context} · ${section.code} ${section.title}`,
          body: item,
          targetId: sectionTarget,
          matchType: `knowledge-${index + 1}`
        }));
        return [sectionEntry, ...itemEntries];
      })
    )
  );

  const chapterOneEntries = chapterOneSections.map((section) => ({
    title: section.title,
    context: `Chapter 1 guide · ${section.tag}`,
    body: `${section.summary} ${section.bullets.join(" ")} ${section.terms.join(" ")}`,
    targetId: chapterOneId(section.number),
    matchType: "chapter-guide"
  }));

  const topicEntries = topicBank.map((topic) => ({
    title: topic.name,
    context: "Revision analyzer topic",
    body: `${topic.name} ${topic.keywords.join(" ")} ${topic.focus}`,
    targetId: "igcse-0478",
    matchType: "topic-bank"
  }));

  return [...syllabusEntries, ...chapterOneEntries, ...topicEntries].map((entry) => ({
    ...entry,
    searchText: normaliseSearchText(`${entry.title} ${entry.context} ${entry.body}`),
    tokens: searchTokens(`${entry.title} ${entry.context} ${entry.body}`)
  }));
}

async function renderKnowledgeSearchResults(query) {
  const resultsContainer = $("knowledgeSearchResults");
  const status = $("knowledgeSearchStatus");
  if (!resultsContainer || !status) return [];

  const trimmed = query.trim();
  if (!trimmed) {
    status.textContent = "Type a term to locate any knowledge point.";
    resultsContainer.innerHTML = "";
    return [];
  }

  const matches = (await findKnowledgeMatchesFromApi(trimmed)) || findKnowledgeMatches(trimmed);
  const exactCount = matches.filter((match) => match.isExact).length;
  status.textContent = exactCount
    ? `${exactCount} exact match${exactCount === 1 ? "" : "es"} found.`
    : matches.length
      ? "No exact match. Showing related knowledge points."
      : "No related knowledge point found.";

  resultsContainer.innerHTML = matches
    .slice(0, 6)
    .map(
      (match, index) => `
      <button class="search-result" type="button" data-search-index="${index}">
        <strong>${highlightSearchTerm(escapeHtml(match.title), trimmed)}</strong>
        <span>${highlightSearchTerm(escapeHtml(match.context), trimmed)}</span>
      </button>
    `
    )
    .join("");

  resultsContainer.querySelectorAll(".search-result").forEach((button) => {
    button.addEventListener("click", () => {
      const match = matches[Number(button.dataset.searchIndex)];
      if (match) locateKnowledgePoint(match, trimmed);
    });
  });

  return matches;
}

async function findKnowledgeMatchesFromApi(query) {
  if (!window.location.protocol.startsWith("http")) return null;
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) return null;
    const payload = await response.json();
    return payload.matches;
  } catch {
    return null;
  }
}

function findKnowledgeMatches(query) {
  const normalisedQuery = normaliseSearchText(query);
  const queryTokens = searchTokens(query);
  if (!normalisedQuery || !queryTokens.length) return [];

  return knowledgeSearchIndex()
    .map((entry) => {
      const exactPhrase = entry.searchText.includes(normalisedQuery);
      const tokenScore = queryTokens.reduce((total, token) => {
        if (entry.tokens.includes(token)) return total + 18;
        if (entry.tokens.some((entryToken) => entryToken.includes(token) || token.includes(entryToken))) return total + 11;
        const closest = Math.max(...entry.tokens.map((entryToken) => similarityScore(token, entryToken)), 0);
        return total + closest * 10;
      }, 0);
      const titleBoost = normaliseSearchText(entry.title).includes(normalisedQuery) ? 30 : 0;
      const score = (exactPhrase ? 80 : 0) + titleBoost + tokenScore / queryTokens.length;
      return { ...entry, score, isExact: exactPhrase || titleBoost > 0 };
    })
    .filter((entry) => entry.score >= 6)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

function questionSearchIndex() {
  return pastPaperQuestionBank.map((hit, index) => {
    const section = syllabusSectionByCode(hit.section);
    const sectionTitle = section ? `${section.code} ${section.title}` : hit.section;
    const chapter = syllabusChapterForSection(hit.section);
    const chapterTitle = chapter ? `${chapter.chapter}. ${chapter.title}` : "";
    const topic = topicForQuestion(hit, section, chapter);
    const source = hit.ref ? `${hit.paper} ${hit.ref}` : hit.paper;
    const searchBody = [
      hit.knowledge,
      hit.question,
      hit.answer,
      sectionTitle,
      chapterTitle,
      topic.keywords.join(" ")
    ].join(" ");

    return {
      ...hit,
      syllabusId: hit.syllabusId || "caie-igcse-0478",
      id: questionId(hit, index),
      index,
      source,
      sectionTitle,
      chapterTitle,
      paperLabel: hit.paper,
      qpTarget: paperChipIdFromPaper(hit.paper, "qp"),
      msTarget: paperChipIdFromPaper(hit.paper, "ms"),
      topicSummary: topic.summary,
      tags: topic.keywords,
      searchText: normaliseSearchText(searchBody),
      tokens: searchTokens(searchBody)
    };
  });
}

async function renderQuestionFinderResults(query) {
  const resultsContainer = $("questionFinderResults");
  const status = $("questionFinderStatus");
  if (!resultsContainer || !status) return [];

  const trimmed = query.trim();
  if (!trimmed) {
    state.questionMatches = [];
    status.textContent = "Choose a syllabus and enter a knowledge point.";
    resultsContainer.innerHTML = `<p class="question-empty-state">Try a precise topic such as lossless compression, or a broader chapter phrase such as data storage.</p>`;
    return [];
  }

  const syllabusIds = selectedQuestionSyllabusIds();
  if (!syllabusIds.length) {
    status.textContent = "Select at least one syllabus.";
    return [];
  }

  let payload;
  try {
    payload = await findQuestionMatchesFromApi(trimmed, syllabusIds);
  } catch (error) {
    if (!error.status) {
      payload = {
        matches: findQuestionMatches(trimmed),
        access: state.questionAccess || { loggedIn: false, purchased: false, canSearch: true }
      };
    } else {
    status.textContent = error.message || "Could not search the question bank.";
    await loadQuestionFinderAccess();
    return [];
    }
  }

  const matches = payload.matches || [];
  if (payload.access) renderQuestionFinderAccess(payload.access);
  state.questionMatches = matches;
  const exactCount = matches.filter((match) => match.isExact).length;
  status.textContent = matches.length
    ? `${matches.length} matching question${matches.length === 1 ? "" : "s"} found${exactCount ? `, ${exactCount} exact` : ""}.`
    : "No related exam questions found.";

  resultsContainer.innerHTML = matches.length
    ? matches.map(questionResultMarkup).join("")
    : `<p class="question-empty-state">No question in the indexed bank matches this term yet. Try a broader phrase, or add tags to the question bank for this knowledge point.</p>`;

  return matches;
}

async function findQuestionMatchesFromApi(query, syllabusIds) {
  if (!window.location.protocol.startsWith("http")) throw new Error("Question Finder requires the PaperLens server.");
  const response = await fetch("/api/question-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      syllabusIds
    })
  });
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.error || "Question search failed.");
    error.status = response.status;
    throw error;
  }
  return payload;
}

function selectedQuestionSyllabusIds() {
  return [...document.querySelectorAll(".question-syllabus-input:checked")].map((input) => input.value);
}

async function loadQuestionFinderAccess() {
  if (!window.location.protocol.startsWith("http")) return;
  try {
    const response = await fetch("/api/question-finder/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    if (!response.ok) return;
    renderQuestionFinderAccess(await response.json());
  } catch {}
}

function renderQuestionFinderAccess(access) {
  state.questionAccess = access;
  const bar = $("questionFinderAccessBar");
  const title = $("questionFinderAccessTitle");
  const detail = $("questionFinderAccessDetail");
  const loginLink = $("questionFinderLoginLink");
  const buyButton = $("questionFinderBuyButton");
  const section = $("question-finder");
  const searchButton = $("questionFinderSubmit");
  const searchLocked = Boolean(access.loggedIn && !access.canSearch);

  bar?.classList.toggle("has-full-access", Boolean(access.purchased));
  bar?.classList.toggle("is-exhausted", Boolean(access.loggedIn && !access.purchased && access.remaining === 0));
  section?.classList.toggle("is-search-locked", searchLocked);

  if (!access.loggedIn) {
    if (title) title.textContent = "Sign in to start";
    if (detail) detail.textContent = "Two successful searches are included before purchase.";
  } else if (access.purchased) {
    if (title) title.textContent = "Full Question Finder access";
    if (detail) detail.textContent = "Unlimited syllabus searches, previews, and answer practice.";
  } else if (access.remaining > 0) {
    if (title) title.textContent = `${access.remaining} free search${access.remaining === 1 ? "" : "es"} remaining`;
    if (detail) detail.textContent = "A search is counted only when at least one question is shown.";
  } else {
    if (title) title.textContent = "Free searches complete";
    if (detail) detail.textContent = "Buy access to continue searching and practising with mark-scheme feedback.";
  }

  if (loginLink) loginLink.hidden = Boolean(access.loggedIn);
  if (buyButton) buyButton.hidden = Boolean(access.purchased);
  if (searchButton) searchButton.disabled = searchLocked;
  document.querySelectorAll("[data-question-suggestion]").forEach((button) => {
    button.disabled = searchLocked;
  });
}

function findQuestionMatches(query) {
  const normalisedQuery = normaliseSearchText(query);
  const queryTokens = searchTokens(query);
  if (!normalisedQuery || !queryTokens.length) return [];

  return questionSearchIndex()
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
    .sort((a, b) => b.score - a.score || b.paper.localeCompare(a.paper))
    .slice(0, 30);
}

function questionResultMarkup(match) {
  const questionUrl = questionPreviewUrl(match.id, "qp");
  const answerUrl = questionPreviewUrl(match.id, "ms");
  const questionAlt = `Original past-paper question ${match.source}`;
  const answerAlt = `Original mark scheme answer ${match.source}`;
  return `
    <article class="question-result-card" data-question-card="${match.id}">
      <div class="question-card-head">
        <div class="question-card-title">
          <strong>${highlightSearchTerm(escapeHtml(match.knowledge), $("questionFinderInput")?.value || "")}</strong>
          <div class="question-meta-row">
            <span>${escapeHtml(match.source)}</span>
            <span>Syllabus: ${escapeHtml(match.sectionTitle)}</span>
          </div>
        </div>
        <button class="question-practice-button" type="button" data-question-practice-id="${escapeHtml(match.id)}">Answer</button>
      </div>
      <button
        class="question-preview-button"
        type="button"
        aria-label="Open ${escapeHtml(questionAlt)}"
        data-question-preview-url="${escapeHtml(questionUrl)}"
        data-question-preview-alt="${escapeHtml(questionAlt)}"
      >
        <img
          class="original-question-preview"
          src="${escapeHtml(questionUrl)}"
          alt="${escapeHtml(questionAlt)}"
          loading="lazy"
        />
      </button>
      <details class="question-answer-preview">
        <summary>View mark scheme answer</summary>
        <button
          class="question-preview-button question-answer-image-button"
          type="button"
          aria-label="Open ${escapeHtml(answerAlt)}"
          data-question-preview-url="${escapeHtml(answerUrl)}"
          data-question-preview-alt="${escapeHtml(answerAlt)}"
        >
          <img
            class="original-question-preview"
            src="${escapeHtml(answerUrl)}"
            alt="${escapeHtml(answerAlt)}"
            loading="lazy"
          />
        </button>
      </details>
    </article>
  `;
}

function handleQuestionPracticeClick(event) {
  const button = event.target.closest("[data-question-practice-id]");
  if (!button) return;
  const question = state.questionMatches.find((match) => match.id === button.dataset.questionPracticeId) || questionSearchIndex().find((match) => match.id === button.dataset.questionPracticeId);
  if (!question) return;
  openPracticeModal(question);
}

function questionPreviewUrl(questionId, type = "qp") {
  const params = new URLSearchParams({
    id: questionId,
    type
  });
  return `/api/question-preview?${params.toString()}`;
}

function openPracticeModal(question) {
  state.activePracticeQuestion = question;
  state.activePracticeParts = practicePartsForQuestion(question);
  state.activePracticePartIndex = 0;
  state.activePracticeMode = "free";
  const modal = $("practiceModal");
  if (!modal) return;

  $("practiceSource").textContent = question.source || "Question practice";
  $("practiceTitle").textContent = question.knowledge || "Answer this question";
  $("practiceMeta").innerHTML = `
    <span>${escapeHtml(question.sectionTitle || question.section || "Syllabus")}</span>
    <span>${escapeHtml(question.paperLabel || question.paper || "Past paper")}</span>
  `;
  renderPracticePartTabs();
  renderActivePracticePart();
  setPracticeMode("free");
  const feedback = $("practiceFeedback");
  if (feedback) {
    feedback.hidden = true;
    feedback.innerHTML = "";
  }
  setPracticeStatus("");
  modal.hidden = false;
  document.body.classList.add("practice-modal-open");
  answer?.focus();
}

function closePracticeModal() {
  const modal = $("practiceModal");
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  state.activePracticeQuestion = null;
  state.activePracticeParts = [];
  state.activePracticePartIndex = 0;
  document.body.classList.remove("practice-modal-open");
}

function practicePartsForQuestion(question) {
  if (Array.isArray(question.parts) && question.parts.length) {
    return question.parts
      .map((part, index) => ({
        label: part.label || `Question ${index + 1}`,
        originalLabel: part.originalLabel || "",
        prompt: cleanQuestionText(part.prompt || ""),
        markScheme: part.markScheme || ""
      }))
      .filter((part) => part.prompt.length > 4)
      .slice(0, 12);
  }

  const cleaned = cleanQuestionText(question.question || "");
  const markers = [...cleaned.matchAll(/\([a-z]\)(?:\s*\([ivx]+\))?|\([ivx]+\)/gi)]
    .map((match) => ({
      label: match[0].trim(),
      index: match.index || 0,
      end: (match.index || 0) + match[0].length
    }))
    .filter((marker, index, list) => index === 0 || marker.index - list[index - 1].index > 8);

  const partMatches = markers
    .map((marker, index) => ({
      label: `Question ${index + 1}`,
      originalLabel: marker.label,
      prompt: cleanQuestionText(cleaned.slice(marker.end, markers[index + 1]?.index || cleaned.length))
    }))
    .filter((part) => part.prompt.length > 12);

  if (partMatches.length > 1) return partMatches.slice(0, 12);

  return [{ label: "Question 1", originalLabel: "", prompt: cleaned || question.knowledge || "Answer this question." }];
}

function cleanQuestionText(value) {
  return String(value || "")
    .replace(/[\u0000-\u001f]+/g, " ")
    .replace(/Ĭ[^A-Za-z0-9()[\].,;:!?'" \/-]{2,}[^A-Za-z0-9()[\].,;:!?'" \/-]*/g, " ")
    .replace(/© UCLES \d{4} 0478\/\d{2}\/[A-Z]\/[A-Z]\/\d{2}/g, " ")
    .replace(/\[Turn over\s+\d+[^A-Za-z]*(?=(?:\([a-z]\)|\d+\s|$))/gi, " ")
    .replace(/\bDO NOT WRITE IN THIS MARGIN\b/gi, " ")
    .replace(/Permission to reproduce[\s\S]*?department of the University of Cambridge\./gi, " ")
    .replace(/\.{8,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function renderPracticePartTabs() {
  const list = $("practicePartList");
  if (!list) return;
  list.innerHTML = state.activePracticeParts
    .map((part, index) => `
      <button class="${index === state.activePracticePartIndex ? "is-active" : ""}" type="button" data-practice-part="${index}">
        ${escapeHtml(part.label)}
      </button>
    `)
    .join("");
}

function handlePracticePartClick(event) {
  const button = event.target.closest("[data-practice-part]");
  if (!button) return;
  state.activePracticePartIndex = Number(button.dataset.practicePart) || 0;
  renderPracticePartTabs();
  renderActivePracticePart();
  setPracticeMode(state.activePracticeMode);
}

function activePracticePart() {
  return state.activePracticeParts[state.activePracticePartIndex] || state.activePracticeParts[0] || null;
}

function renderActivePracticePart() {
  const part = activePracticePart();
  const text = part?.prompt || state.activePracticeQuestion?.question || "";
  $("practiceQuestionLabel").textContent = part?.label || "Question 1";
  $("practiceQuestionText").textContent = text;
  const answer = $("practiceAnswer");
  if (answer) answer.value = "";
  const feedback = $("practiceFeedback");
  if (feedback) {
    feedback.hidden = true;
    feedback.innerHTML = "";
  }
  setPracticeStatus("");
}

function setPracticeMode(mode) {
  state.activePracticeMode = ["free", "template", "outline"].includes(mode) ? mode : "free";
  document.querySelectorAll("[data-practice-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.practiceMode === state.activePracticeMode);
  });

  const label = document.querySelector('label[for="practiceAnswer"]');
  const answer = $("practiceAnswer");
  const template = $("practiceTemplate");
  const keywordGrid = $("keywordInputGrid");
  if (!answer || !template || !keywordGrid) return;

  answer.value = "";
  template.hidden = true;
  template.innerHTML = "";
  keywordGrid.hidden = true;
  keywordGrid.innerHTML = "";
  answer.hidden = false;

  if (state.activePracticeMode === "template") {
    const built = buildKeywordTemplate(state.activePracticeQuestion, activePracticePart());
    state.activeTemplateKeywords = built.keywords;
    if (label) label.textContent = "Fill keywords 1 to 5";
    template.hidden = false;
    template.innerHTML = built.html;
    keywordGrid.hidden = false;
    keywordGrid.innerHTML = built.keywords
      .map((_, index) => `
        <label>
          <span>${index + 1}</span>
          <input type="text" data-keyword-input="${index}" autocomplete="off" />
        </label>
      `)
      .join("");
    answer.hidden = true;
    keywordGrid.querySelector("input")?.focus();
  } else if (state.activePracticeMode === "outline") {
    state.activeTemplateKeywords = [];
    if (label) label.textContent = "Use this answer frame";
    template.hidden = false;
    template.innerHTML = answerFrameMarkup(state.activePracticeQuestion);
    answer.placeholder = "Write a complete answer for the current question using the frame above.";
  } else {
    state.activeTemplateKeywords = [];
    if (label) label.textContent = "Your answer";
    answer.placeholder = "Write your exam-style answer for the current question here...";
  }
  if (!answer.hidden) answer.focus();
}

function buildKeywordTemplate(question, part = null) {
  const points = markSchemePoints(part?.markScheme || question?.answer || "");
  const sentence = points.slice(0, 3).join(". ") || "Use the correct technical terms from the mark scheme.";
  const keywords = extractTemplateKeywords(sentence).slice(0, 5);
  let html = escapeHtml(sentence);
  keywords.forEach((keyword, index) => {
    html = html.replace(new RegExp(`\\b${escapeRegExp(escapeHtml(keyword))}\\b`, "i"), `<span class="keyword-blank">${index + 1}</span>`);
  });
  return {
    keywords,
    html: `<p>${html}</p><small>${keywords.length} keyword${keywords.length === 1 ? "" : "s"} hidden. Enter them in order.</small>`
  };
}

function markSchemePoints(answer) {
  return String(answer || "")
    .replace(/^MS:\s*/i, "")
    .split(/;|\n|(?:\.\s+)/)
    .map((point) => point.trim())
    .filter((point) => point.length > 6);
}

function extractTemplateKeywords(text) {
  const stop = new Set(["features", "include", "used", "data", "storage", "answer", "computer", "until", "deleted"]);
  return [...new Set(String(text).toLowerCase().match(/\b[a-z][a-z-]{4,}\b/g) || [])]
    .filter((word) => !stop.has(word));
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function answerFrameMarkup(question) {
  const points = markSchemePoints(activePracticePart()?.markScheme || question?.answer || "").slice(0, 4);
  return `
    <div class="answer-frame">
      <p>Start with the command word, then make one clear point per mark.</p>
      <ol>
        ${
          points.length
            ? points.map((point, index) => `<li>Point ${index + 1}: explain ${escapeHtml(extractTemplateKeywords(point)[0] || "the key idea")} in your own words.</li>`).join("")
            : "<li>Define the key term.</li><li>Add a technical detail.</li><li>Link it back to the question.</li>"
        }
      </ol>
    </div>
  `;
}

function openActivePracticePreview() {
  if (!state.activePracticeQuestion) return;
  const url = paperPdfUrlForQuestion(state.activePracticeQuestion, "qp");
  if (url) {
    openPaperModal(url);
    return;
  }
  setPracticeStatus("The full past-paper PDF is not available locally.", true);
}

function openPaperModal(url) {
  const modal = $("paperModal");
  const frame = $("paperFrame");
  if (!modal || !frame || !url) return;
  frame.src = url;
  modal.hidden = false;
  document.body.classList.add("paper-modal-open");
  $("paperCloseButton")?.focus();
}

function closePaperModal() {
  const modal = $("paperModal");
  const frame = $("paperFrame");
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  if (frame) frame.removeAttribute("src");
  document.body.classList.remove("paper-modal-open");
}

async function submitPracticeAnswer(event) {
  event.preventDefault();
  const question = state.activePracticeQuestion;
  if (!question) return;

  const answer = practiceAnswerValue();
  if (!answer) {
    setPracticeStatus("Write an answer first.", true);
    return;
  }

  if (state.activePracticeMode === "template") {
    renderKeywordFeedback(answer);
    return;
  }

  const button = $("practiceSubmitButton");
  if (button) {
    button.disabled = true;
    button.textContent = "Checking...";
  }
  setPracticeStatus("Checking against the mark scheme...");

  try {
    const response = await fetch("/api/grade-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: question.id,
        userAnswer: answer,
        mode: state.activePracticeMode,
        part: activePracticePart()
      })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Could not check the answer.");
    renderPracticeFeedback(payload.grading);
    setPracticeStatus("Checked.");
  } catch (error) {
    setPracticeStatus(error.message || "Could not check the answer.", true);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Check answer";
    }
  }
}

function practiceAnswerValue() {
  if (state.activePracticeMode === "template") {
    return [...document.querySelectorAll("[data-keyword-input]")]
      .map((input) => input.value.trim())
      .join(", ")
      .trim();
  }
  return $("practiceAnswer")?.value.trim() || "";
}

function renderKeywordFeedback(answer) {
  const submitted = answer
    .split(/,|\n/)
    .map((item) => normaliseSearchText(item))
    .filter(Boolean);
  const expected = state.activeTemplateKeywords.map((item) => normaliseSearchText(item));
  const rows = expected.map((keyword, index) => ({
    expected: state.activeTemplateKeywords[index],
    submitted: submitted[index] || "",
    correct: submitted[index] === keyword
  }));
  const score = rows.filter((row) => row.correct).length;
  const feedback = $("practiceFeedback");
  if (!feedback) return;
  feedback.hidden = false;
  feedback.innerHTML = `
    <div class="practice-score"><span>Keyword score</span><strong>${score}/${expected.length}</strong></div>
    <div class="practice-mark-list ${score === expected.length ? "awarded" : "missed"}">
      <strong>Keyword check</strong>
      <ul>
        ${rows.map((row, index) => `
          <li class="${row.correct ? "is-correct" : "is-incorrect"}">
            <span>${index + 1}. ${escapeHtml(row.expected)}</span>
            <em>${row.correct ? "Correct" : "Incorrect"}</em>
          </li>
        `).join("")}
      </ul>
    </div>
  `;
  setPracticeStatus(score === expected.length ? "All keywords correct." : "Some keywords need another try.", score !== expected.length);
}

function setPracticeStatus(message, isError = false) {
  const status = $("practiceStatus");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function renderPracticeFeedback(grading) {
  const feedback = $("practiceFeedback");
  if (!feedback) return;
  feedback.hidden = false;
  feedback.innerHTML = `
    <div class="practice-score">
      <span>Score</span>
      <strong>${escapeHtml(formatScore(grading.score))}/${escapeHtml(formatScore(grading.maxScore))}</strong>
    </div>
    ${practiceListMarkup("Awarded points", grading.awardedPoints, "awarded")}
    ${practiceListMarkup("Missed points", grading.missedPoints, "missed")}
    ${practiceIssuesMarkup(grading.issues)}
    <div class="practice-feedback-note">
      <strong>Feedback</strong>
      <p>${escapeHtml(grading.feedback || "No extra feedback.")}</p>
    </div>
    <div class="practice-feedback-note">
      <strong>Improved answer</strong>
      <p>${escapeHtml(grading.improvedAnswer || "No improved answer returned.")}</p>
    </div>
  `;
}

function practiceListMarkup(title, items = [], tone = "") {
  const safeItems = Array.isArray(items) ? items : [];
  return `
    <div class="practice-mark-list ${tone}">
      <strong>${escapeHtml(title)}</strong>
      ${
        safeItems.length
          ? `<ul>${safeItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
          : `<p>No ${title.toLowerCase()} identified.</p>`
      }
    </div>
  `;
}

function practiceIssuesMarkup(issues = []) {
  if (!Array.isArray(issues) || !issues.length) return "";
  return `
    <div class="practice-issues">
      <strong>Lost-mark patterns</strong>
      <ul>
        ${issues.map((issue) => `<li><span>${escapeHtml(issue.type)}</span>${escapeHtml(issue.comment)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function formatScore(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return Number.isInteger(number) ? String(number) : number.toFixed(1);
}

function handleQuestionPreviewClick(event) {
  const pdfButton = event.target.closest("[data-question-preview-pdf-url]");
  if (pdfButton) {
    openPaperModal(pdfButton.dataset.questionPreviewPdfUrl);
    return;
  }

  const button = event.target.closest("[data-question-preview-url]");
  if (!button) return;
  const modal = $("questionImageModal");
  const image = $("questionImageModalImage");
  if (!modal || !image) return;
  image.src = button.dataset.questionPreviewUrl;
  image.alt = button.dataset.questionPreviewAlt || "Original paper preview";
  modal.hidden = false;
  document.body.classList.add("question-image-modal-open");
  $("questionImageCloseButton")?.focus();
}

function handleQuestionPreviewImageError(event) {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.classList.contains("original-question-preview")) return;
  const button = image.closest("[data-question-preview-url]");
  if (!button) return;
  const question = state.questionMatches.find((match) => questionPreviewUrl(match.id, "qp") === image.getAttribute("src"));
  const pdfUrl = paperPdfUrlForQuestion(question, "qp");
  button.classList.add("is-preview-unavailable");
  button.innerHTML = pdfUrl
    ? `<span>Open full past paper</span>`
    : `<span>Original paper preview is unavailable</span>`;
  if (pdfUrl) {
    button.dataset.questionPreviewPdfUrl = pdfUrl;
    delete button.dataset.questionPreviewUrl;
  }
}

function closeQuestionImageModal() {
  const modal = $("questionImageModal");
  const image = $("questionImageModalImage");
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  if (image) image.removeAttribute("src");
  document.body.classList.remove("question-image-modal-open");
}

function questionId(hit, index) {
  return `${hit.paper}-${hit.ref || index}-${hit.section}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function syllabusSectionByCode(code) {
  for (const chapters of Object.values(syllabusChecklist)) {
    for (const chapter of chapters) {
      const section = chapter.sections.find((candidate) => candidate.code === code);
      if (section) return section;
    }
  }
  return null;
}

function syllabusChapterForSection(code) {
  for (const chapters of Object.values(syllabusChecklist)) {
    for (const chapter of chapters) {
      if (chapter.sections.some((section) => section.code === code)) return chapter;
    }
  }
  return null;
}

function topicForQuestion(hit, section, chapter) {
  const text = `${hit.knowledge} ${hit.question} ${hit.answer} ${section?.title || ""} ${chapter?.title || ""}`;
  return {
    summary: section ? `${section.code} ${section.title}` : hit.section,
    keywords: extractSearchTerms(text)
  };
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

function locateKnowledgePoint(match, query = "") {
  const target = document.getElementById(match.targetId);
  if (!target) return;

  const parentDetails = target.closest("details");
  if (parentDetails) parentDetails.open = true;

  clearLocatedSearchHighlights();
  highlightLocatedSearchTerms(target, query, match);

  target.classList.remove("search-target");
  window.requestAnimationFrame(() => {
    target.classList.add("search-target");
    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  });

  if (window.history.replaceState) {
    window.history.replaceState(null, "", `#${match.targetId}`);
  }
}

function clearLocatedSearchHighlights() {
  document.querySelectorAll("mark.located-search-mark").forEach((mark) => {
    const textNode = document.createTextNode(mark.textContent);
    mark.replaceWith(textNode);
    textNode.parentElement?.normalize();
  });
}

function highlightLocatedSearchTerms(target, query, match) {
  const tokens = highlightTokensForMatch(query, match);
  if (!tokens.length) return;

  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "gi");
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest("script, style, mark, a, button")) return NodeFilter.FILTER_REJECT;
      pattern.lastIndex = 0;
      return pattern.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    pattern.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    node.nodeValue.replace(pattern, (matchText, _term, offset) => {
      if (offset > cursor) fragment.append(document.createTextNode(node.nodeValue.slice(cursor, offset)));
      const mark = document.createElement("mark");
      mark.className = "located-search-mark";
      mark.textContent = matchText;
      fragment.append(mark);
      cursor = offset + matchText.length;
      return matchText;
    });
    if (cursor < node.nodeValue.length) fragment.append(document.createTextNode(node.nodeValue.slice(cursor)));
    node.replaceWith(fragment);
  });
}

function highlightTokensForMatch(query, match) {
  const queryTokens = searchTokens(query);
  const exactTokens = queryTokens.filter((token) => match.tokens.includes(token));
  const fuzzyTokens = queryTokens.flatMap((token) =>
    match.tokens
      .filter((entryToken) => entryToken.length > 2 && (entryToken.includes(token) || token.includes(entryToken) || similarityScore(token, entryToken) >= 0.72))
      .sort((a, b) => similarityScore(token, b) - similarityScore(token, a))
      .slice(0, 2)
  );

  return [...new Set([...exactTokens, ...fuzzyTokens])]
    .filter((token) => token.length > 1)
    .sort((a, b) => b.length - a.length)
    .slice(0, 8);
}

function normaliseSearchText(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function searchTokens(value) {
  return normaliseSearchText(value)
    .split(/\s+/)
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
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + cost
      );
    }
  }

  return rows[a.length][b.length];
}

function highlightSearchTerm(text, query) {
  return searchTokens(query).reduce((output, token) => {
    const pattern = new RegExp(`(${escapeRegExp(token)})`, "gi");
    return output.replace(pattern, "<mark>$1</mark>");
  }, text);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function highlightKeywords(text) {
  const terms = [
    "binary",
    "logic circuits",
    "registers",
    "base 10",
    "base 2",
    "base 16",
    "hexadecimal",
    "four binary bits",
    "overflow",
    "255",
    "left shifts",
    "right shifts",
    "two's complement",
    "-128",
    "+127",
    "ASCII",
    "Unicode",
    "sample rate",
    "sample resolution",
    "resolution",
    "colour depth",
    "1024",
    "RLE",
    "lossless",
    "lossy",
    "header",
    "payload",
    "trailer",
    "packet switching",
    "parity",
    "checksum",
    "echo check",
    "check digit",
    "ARQ",
    "public and private keys",
    "ALU",
    "CU",
    "registers",
    "fetch",
    "decode",
    "execute",
    "RAM",
    "ROM",
    "virtual memory",
    "MAC address",
    "IP address",
    "router",
    "operating system",
    "interrupts",
    "compiler",
    "interpreter",
    "IDE",
    "HTTP",
    "HTTPS",
    "cookies",
    "blockchain",
    "malware",
    "phishing",
    "firewalls",
    "encryption",
    "sensors",
    "microprocessor",
    "actuators",
    "expert systems",
    "machine learning",
    "training data",
    "knowledge base",
    "inference engine",
    "decomposition",
    "abstraction",
    "linear search",
    "bubble sort",
    "assignment",
    "validation",
    "verification",
    "normal",
    "abnormal",
    "boundary",
    "trace tables",
    "pseudocode",
    "arrays",
    "constants",
    "operators",
    "string handling",
    "local variables",
    "global variables",
    "parameters",
    "maintainability",
    "primary key",
    "field names",
    "range check",
    "type check",
    "length check",
    "presence check",
    "format check",
    "lookup check",
    "ascending",
    "descending",
    "forms",
    "reports",
    "embedded systems",
    "opcode",
    "operand",
    "ADC",
    "DAC",
    "monitoring",
    "control systems",
    "utility software",
    "assembler",
    "buffer",
    "SSL",
    "TLS",
    "pharming",
    "social engineering",
    "proxy servers",
    "botnets",
    "DDoS",
    "malware",
    "ransomware",
    "brute-force",
    "data interception",
    "bubble sort",
    "SUM",
    "COUNT",
    "SELECT",
    "FROM",
    "WHERE",
    "truth tables",
    "logic circuits"
  ].sort((a, b) => b.length - a.length);
  return terms.reduce((output, term) => {
    const pattern = new RegExp(`\\b(${escapeRegExp(term)})\\b`, "gi");
    return output.replace(pattern, "<mark>$1</mark>");
  }, text);
}

function sectionVisual(section) {
  const visuals = {
    "1.1": `
      ${tableBlock(["Number system", "Base", "Digits used", "Use"], [
        ["Denary", "10", "0-9", "normal human number system"],
        ["Binary", "2", "0 and 1", "used by computers"],
        ["Hexadecimal", "16", "0-9 and A-F", "shorter representation of binary"]
      ], "number-system-table")}
      <div class="worked-example">
        <h5>Worked example: binary to denary</h5>
        <div class="place-value-example">
          <p><strong>Binary:</strong> 10110110</p>
          <table>
            <tr><th>128</th><th>64</th><th>32</th><th>16</th><th>8</th><th>4</th><th>2</th><th>1</th></tr>
            <tr><td>1</td><td>0</td><td>1</td><td>1</td><td>0</td><td>1</td><td>1</td><td>0</td></tr>
          </table>
          <p>= 128 + 32 + 16 + 4 + 2</p>
          <p>= <strong>182</strong></p>
        </div>
      </div>
    `,
    "1.2": tableBlock(["Representation", "Exam focus", "Mark-scheme keywords"], [
      ["Text", "ASCII vs Unicode", "<strong>more characters</strong>, <strong>languages</strong>, <strong>more bits</strong>"],
      ["Sound", "Sampling and quality", "<strong>sample rate</strong>, <strong>sample resolution</strong>, <strong>larger file size</strong>"],
      ["Image", "Quality and file size", "<strong>pixels</strong>, <strong>resolution</strong>, <strong>colour depth</strong>"]
    ]),
    "1.3": `
      <div class="formula-grid">
        <div><strong>Image bits</strong><span>width x height x colour depth</span></div>
        <div><strong>Sound bits</strong><span>sample rate x sample resolution x duration x channels</span></div>
        <div><strong>Unit conversion</strong><span>1 byte = 8 bits; 1 KiB = 1024 bytes; 1 MiB = 1024 KiB</span></div>
      </div>
      ${tableBlock(["Compression", "Can original be restored?", "Best for"], [
        ["Lossless", "<strong>Yes</strong>", "text, code, medical/important images, RLE"],
        ["Lossy", "<strong>No</strong>", "photos, audio, video where quality loss is acceptable"]
      ])}
    `,
    "2.1": flowBlock([
      ["Data split into packets", "Large data is divided so each packet can be sent, routed and resent if needed."],
      ["Routers choose routes", "Each packet is forwarded across the network using address information in the packet header."],
      ["Packets may arrive out of order", "Different routes can take different times, so packet numbers are needed."],
      ["Receiver reorders packets", "The destination uses packet numbers to rebuild the original data."]
    ]),
    "2.2": tableBlock(["Method", "What to remember"], [
      ["Parity", "odd/even parity bit checks changed bits"],
      ["Checksum", "calculated value is compared after transmission"],
      ["Echo check", "receiver sends data back for comparison"],
      ["ARQ", "uses acknowledgement, timeout and retransmission"]
    ]),
    "2.3": tableBlock(["Encryption type", "Key idea", "Exam contrast"], [
      ["Symmetric", "same key encrypts and decrypts", "fast but key sharing is a risk"],
      ["Asymmetric", "public/private key pair", "safer key exchange but more complex"]
    ]),
    "3.1": flowBlock([
      ["PC", "Holds the address of the next instruction."],
      ["MAR", "Sends the address to memory."],
      ["MDR", "Stores data or instructions moving to/from memory."],
      ["CIR", "Stores the current instruction."],
      ["CU", "Decodes and controls execution."],
      ["ALU/ACC", "Carries out calculations and stores results."]
    ]),
    "3.2": tableBlock(["Scenario", "Likely device", "Reason"], [
      ["Scan product", "barcode / QR scanner", "fast machine-readable input"],
      ["Measure environment", "sensor", "captures physical data"],
      ["Create physical model", "3D printer", "produces solid output"]
    ]),
    "3.3": tableBlock(["Storage", "Key mechanism", "Typical examples"], [
      ["Magnetic", "platters, tracks, sectors, electromagnets", "HDD"],
      ["Optical", "laser reads pits and lands", "CD, DVD, Blu-ray"],
      ["Solid-state", "NAND/NOR flash memory", "SSD, SD card, USB drive"]
    ]),
    "3.4": tableBlock(["Address", "Purpose", "Common mark point"], [
      ["MAC", "hardware/network interface identity", "usually hexadecimal; manufacturer + serial code"],
      ["IP", "network location/address", "static or dynamic; IPv4 vs IPv6"]
    ]),
    "4.1": tableBlock(["Software", "Purpose", "Examples"], [
      ["System software", "runs and manages the computer", "OS, utilities"],
      ["Application software", "helps user complete tasks", "browser, editor, spreadsheet"]
    ]),
    "4.2": tableBlock(["Translator", "How it works", "Useful point"], [
      ["Compiler", "translates whole program before running", "produces executable, errors after compilation"],
      ["Interpreter", "translates/runs line by line", "easier debugging, slower execution"]
    ]),
    "5.1": flowBlock([
      ["Browser requests URL", "The client asks for a web resource."],
      ["DNS finds server address", "Domain name is translated to an IP address."],
      ["HTTP/HTTPS request sent", "HTTPS encrypts the request and response."],
      ["Server returns files", "HTML, CSS, scripts and media are sent back."],
      ["Browser renders page", "The page is interpreted and displayed."]
    ]),
    "5.2": flowBlock([
      ["Transaction requested", "A digital transaction is created."],
      ["Grouped into block", "Transactions are collected together."],
      ["Network validates", "Participants check that the transaction is valid."],
      ["Block linked", "The block is added to the previous block."],
      ["Ledger updated", "Copies of the blockchain record are updated."]
    ]),
    "5.3": tableBlock(["Threat", "Protection", "Keyword"], [
      ["Phishing", "user education, filtering, 2FA", "deception"],
      ["Malware", "anti-malware and updates", "infection"],
      ["Unauthorised access", "passwords, access rights, firewall", "authentication"]
    ]),
    "6.1": flowBlock([
      ["Sensor reads data", "Physical values such as temperature or light are captured."],
      ["Microprocessor compares", "The reading is checked against stored values."],
      ["Decision made", "The system chooses whether action is needed."],
      ["Actuator changes output", "A device such as a motor, heater or valve is controlled."]
    ]),
    "6.2": tableBlock(["Robot use", "Why suitable"], [
      ["Manufacturing", "repetitive and precise"],
      ["Hazardous environments", "reduces human risk"],
      ["Surgery", "precision and control"]
    ]),
    "6.3": flowBlock([
      ["User answers questions", "Facts are collected from the user."],
      ["Inference engine applies rules", "Rules are used to reason from the facts."],
      ["Knowledge base searched", "Stored expert knowledge is checked."],
      ["System outputs advice", "A recommendation or diagnosis is given."]
    ]),
    "7.1": flowBlock([
      ["Analyse problem", "Identify inputs, outputs and required processing."],
      ["Decompose", "Break the problem into smaller parts."],
      ["Design algorithm", "Plan the logic using pseudocode or a flowchart."],
      ["Code solution", "Implement the algorithm."],
      ["Test and maintain", "Check with test data and improve if needed."]
    ]),
    "7.2": tableBlock(["Test data", "Expected purpose"], [
      ["Normal", "accepted by the system"],
      ["Abnormal", "rejected by the system"],
      ["Boundary/extreme", "tests limits of valid ranges"]
    ]),
    "7.3": tableBlock(["Error type", "Meaning"], [
      ["Syntax", "breaks language rules"],
      ["Logic", "runs but gives wrong result"],
      ["Runtime", "fails while executing"]
    ]),
    "8.1": `
      <div class="worked-example">
        <h5>Pseudocode pattern</h5>
        <pre>FOR Index <- 1 TO 10
   IF Scores[Index] >= 50 THEN
      PassCount <- PassCount + 1
   ENDIF
NEXT Index</pre>
      </div>
    `,
    "8.2": tableBlock(["Array", "Use"], [
      ["1D", "list of values, one index"],
      ["2D", "table/grid, row and column index"],
      ["Loop", "read, write, search or total values"]
    ]),
    "8.3": flowBlock([
      ["OPENFILE", "Open the file in the correct mode."],
      ["READFILE / WRITEFILE", "Read existing data or write new data."],
      ["Process data", "Use the data in the program."],
      ["CLOSEFILE", "Close the file after use."]
    ]),
    "9": `
      ${tableBlock(["Area", "What to remember", "Exam trap"], [
        ["Structure", "database, table, record, field, field name and data type", "record = row; field = column"],
        ["Field design", "names should be meaningful, unique, short and clear, e.g. StudentID or OrderDate", "avoid vague names such as thing or date"],
        ["Primary key", "a unique field such as StudentID, BookID or Code", "not just the most important-looking data"],
        ["Validation", "range, type, length, presence, format or lookup check", "validation does not prove data is true"]
      ])}
      ${tableBlock(["Field example", "Suitable data type", "Possible validation"], [
        ["StudentID", "string or integer", "length / presence check"],
        ["Mark", "integer", "range check such as 0 to 100"],
        ["DateOfBirth", "date", "format check"],
        ["Email", "string", "format / presence check"],
        ["Member", "Boolean", "true or false"]
      ])}
      ${tableBlock(["Database tool", "Purpose"], [
        ["Search/query", "find records that match criteria"],
        ["Sort ascending", "A-Z, smallest to largest or oldest to newest"],
        ["Sort descending", "Z-A, largest to smallest or newest to oldest"],
        ["Form", "make data entry or editing easier, often using controls such as drop-down lists"],
        ["Report", "present selected data clearly for viewing or printing"]
      ])}
      ${tableBlock(["SQL keyword", "Meaning"], [
        ["SELECT", "choose fields to display"],
        ["FROM", "choose the table"],
        ["WHERE", "filter records using criteria"],
        ["ORDER BY", "sort the results"],
        ["ASC / DESC", "ascending / descending order"],
        ["SUM / COUNT", "total values / count matching records"]
      ])}
      ${tableBlock(["Common mistake", "Better exam habit"], [
        ["Confusing record and field", "state row/record and column/field explicitly"],
        ["Choosing a non-unique primary key", "justify uniqueness"],
        ["Using = > instead of >=", "write comparison operators carefully"],
        ["Selecting every field", "only select fields requested by the question"],
        ["Assuming validation proves truth", "say it checks whether data is reasonable or allowed"]
      ])}
      <div class="worked-example">
        <h5>SQL pattern</h5>
        <pre>SELECT Name, Score
FROM Results
WHERE Score >= 50
ORDER BY Score DESCENDING</pre>
      </div>
    `,
    "10": tableBlock(["Gate", "Output is 1 when..."], [
      ["AND", "both inputs are 1"],
      ["OR", "at least one input is 1"],
      ["NOT", "input is 0"],
      ["XOR/EOR", "inputs are different"],
      ["NAND/NOR", "inverse of AND / OR"]
    ])
  };
  return visuals[section.code] || "";
}

function tableBlock(headers, rows, extraClass = "") {
  return `<div class="knowledge-table-wrap ${extraClass}"><table class="knowledge-table">
    <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>`;
}

function flowBlock(steps) {
  return `
    <ol class="flow-strip">
      ${steps
        .map((step, index) => {
          const [title, detail] = Array.isArray(step) ? step : [step, ""];
          return `
          <li class="flow-step">
            <strong>${title}</strong>
            ${detail ? `<p>${detail}</p>` : ""}
          </li>
        `;
        })
        .join("")}
    </ol>
  `;
}

function probabilityBadge(stats) {
  return `<span class="exam-probability" title="Weighted by syllabus coverage, textbook alignment, and 2019-2025 past-paper trend signals; newer papers carry more weight.">
    Exam probability ${stats.probability}% · ${stats.signals} signals
  </span>`;
}

function probabilityForChapter(chapter) {
  const sectionStats = chapter.sections.map(probabilityForSection);
  const avg = sectionStats.reduce((sum, item) => sum + item.probability, 0) / sectionStats.length;
  const maxSignals = sectionStats.reduce((sum, item) => sum + item.signals, 0);
  const boosted = Math.min(96, Math.round(avg + Math.min(8, chapter.sections.length)));
  return { probability: boosted, signals: Math.round(maxSignals) };
}

function probabilityForSection(section) {
  const text = `${section.code} ${section.title} ${section.items.join(" ")}`;
  const terms = probabilityTerms(text);
  const signals = sourceLibrary.reduce((total, source) => {
    const weight = pastPaperTrendWeight(source);
    return total + terms.reduce((sum, term) => sum + countTermHits(source.text, term) * weight, 0);
  }, 0);
  const syllabusAnchor = section.items.length * 3;
  const probability = Math.max(38, Math.min(95, Math.round(42 + Math.log2(signals + syllabusAnchor + 1) * 10)));
  return { probability, signals: Math.round(signals + syllabusAnchor) };
}

function pastPaperTrendWeight(source) {
  if (source.name.includes("2023-2025")) return 2.4;
  if (source.name.includes("2019-2022")) return 1.15;
  if (source.name.includes("Mark-scheme")) return 1.25;
  if (source.name.includes("Chapter")) return 0.95;
  return 0.35;
}

function probabilityTerms(text) {
  const phrases = [
    "binary",
    "hexadecimal",
    "overflow",
    "logical shift",
    "two's complement",
    "ascii",
    "unicode",
    "sample rate",
    "sample resolution",
    "colour depth",
    "file size",
    "compression",
    "lossless",
    "lossy",
    "packet",
    "encryption",
    "cpu",
    "fetch decode execute",
    "ram",
    "rom",
    "router",
    "operating system",
    "compiler",
    "interpreter",
    "ide",
    "cookie",
    "cyber security",
    "algorithm",
    "trace table",
    "validation",
    "test data",
    "array",
    "file handling",
    "database",
    "sql",
    "logic gate",
    "truth table"
  ];
  const lower = text.toLowerCase();
  const words = lower.match(/\b[a-z][a-z'-]{4,}\b/g) || [];
  const selectedWords = [...new Set(words.filter((word) => !["explain", "describe", "understand", "compare", "suitable", "given", "using", "including"].includes(word)))];
  return [...new Set([...phrases.filter((phrase) => lower.includes(phrase)), ...selectedWords.slice(0, 18)])];
}

function countTermHits(text, term) {
  const pattern = term.includes(" ")
    ? escapeRegExp(term).replaceAll("\\ ", "\\s+")
    : `\\b${escapeRegExp(term)}\\b`;
  const matches = text.toLowerCase().match(new RegExp(pattern, "g"));
  return matches ? matches.length : 0;
}

function renderPastPaperArchive(containerId) {
  const container = $(containerId);
  if (!container) return;

  container.innerHTML = pastPaperCatalogMarkup();
}

function renderPastPaperCatalog(containerId, paperPrefix) {
  const container = $(containerId);
  if (!container) return;

  container.innerHTML = pastPaperCatalogMarkup(paperPrefix);
}

function pastPaperCatalogMarkup(paperPrefix = "") {

  const latestYear = Math.max(...paperSessions.map((session) => session.year));
  const recentCutoff = latestYear - 1;
  const sessions = paperPrefix
    ? paperSessions.filter((session) => session.components.some((component) => component.startsWith(paperPrefix)))
    : paperSessions;
  const recentSessions = sessions.filter((session) => session.year >= recentCutoff);
  const olderSessions = sessions.filter((session) => session.year < recentCutoff);

  return `
    <div class="catalog-recent">
      ${recentSessions.map((session, index) => catalogSessionMarkup(session, paperPrefix, !hasFullAccess() && index >= previewRecentPaperSessions)).join("")}
    </div>
    <details class="older-catalog ${hasFullAccess() ? "" : "is-locked"}" data-access-locked="${!hasFullAccess()}">
      <summary>Show older papers (${olderSessions.length} sessions)</summary>
      <div class="older-catalog-list">
        ${olderSessions.map((session) => catalogSessionMarkup(session, paperPrefix, !hasFullAccess())).join("")}
      </div>
      ${hasFullAccess() ? "" : lockedOverlay("Buy lifetime access to download the full historical paper archive.")}
    </details>
  `;
}

function catalogSessionMarkup(session, paperPrefix = "", locked = false) {
  const components = paperPrefix
    ? session.components.filter((component) => component.startsWith(paperPrefix))
    : session.components;
  const questionPapers = components.map((component) => catalogChipMarkup(session, "qp", component, `QP ${component}`));
  const markSchemes = components.map((component) => catalogChipMarkup(session, "ms", component, `MS ${component}`));
  const preReleaseComponents = components.filter((component) => component.startsWith("2"));
  const preRelease = session.legacy
    ? preReleaseComponents.map((component) => catalogChipMarkup(session, "pm", component, `PM ${component}`))
    : [];

  return `
    <details class="catalog-session ${locked ? "is-locked" : ""}" id="paper-session-${session.code}${String(session.year).slice(-2)}${paperPrefix ? `-${paperPrefix}` : ""}" data-access-locked="${locked}">
      <summary>${session.year} ${session.season}</summary>
      <div class="catalog-group">
        <span class="catalog-title">Question paper</span>
        <div class="catalog-chips">${questionPapers.join("")}</div>
      </div>
      <div class="catalog-group">
        <span class="catalog-title">Mark scheme</span>
        <div class="catalog-chips">${markSchemes.join("")}</div>
      </div>
      ${
        preRelease.length
          ? `<div class="catalog-group">
              <span class="catalog-title">Pre-release material</span>
              <div class="catalog-chips">${preRelease.join("")}</div>
            </div>`
          : ""
      }
      ${locked ? lockedOverlay("This session is included in the lifetime-access archive.") : ""}
    </details>
  `;
}

function catalogChipMarkup(session, type, component, label) {
  const paper = `0478/${component}/${session.code === "m" ? "F/M" : session.code === "s" ? "M/J" : "O/N"}/${String(session.year).slice(-2)}`;
  const filename = localPaperFilename(session, type, component);
  if (!hasLocalPaperFile(session, type, component)) {
    return `<span id="${paperChipIdFromPaper(paper, type)}" class="catalog-chip is-missing" title="PDF file is not in textbook_syllabus/pastpaper">${label}</span>`;
  }

  return `<a id="${paperChipIdFromPaper(paper, type)}" class="catalog-chip" href="${paperPdfUrl(session, type, component)}" download="${filename}">${label}</a>`;
}

function handlePaperSourceClick(event) {
  const sourceTag = event.target.closest(".paper-source-tag");
  if (!sourceTag) return;

  const paper = sourceTag.dataset.paper;
  const targetId = paper ? paperChipIdFromPaper(paper, "qp") : "";
  const target = targetId ? document.getElementById(targetId) : null;
  if (!target) return;

  event.preventDefault();
  const olderCatalog = target.closest(".older-catalog");
  if (olderCatalog) olderCatalog.open = true;

  const session = target.closest(".catalog-session");
  if (session) session.open = true;

  document.querySelectorAll(".catalog-chip.is-targeted").forEach((chip) => chip.classList.remove("is-targeted"));
  target.classList.add("is-targeted");
  target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  window.history.replaceState(null, "", `#${targetId}`);
}

function renderChapterOne() {
  const board = $("chapterOneBoard");
  if (!board) return;

  board.innerHTML = chapterOneSections
    .map(
      (section) => `
      <details class="chapter-card" id="${chapterOneId(section.number)}" ${Number(section.number) <= 3 ? "open" : ""}>
        <summary>
          <span class="chapter-number">${section.number}</span>
          <span class="chapter-title">${section.title}</span>
          <span class="chapter-tag">${section.tag}</span>
        </summary>
        <p>${section.summary}</p>
        <ul>
          ${section.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}
        </ul>
        <div class="term-row">
          ${section.terms.map((term) => `<span>${term}</span>`).join("")}
        </div>
      </details>
    `
    )
    .join("");
}

function chapterOneId(number) {
  return `chapter-one-${slugPart(number)}`;
}

function setChapterDetails(open) {
  document.querySelectorAll(".chapter-card").forEach((card) => {
    card.open = open;
  });
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

function buildChecklist(results) {
  const threshold = Number($("targetScore").value);
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

function renderSummary(totalSignals) {
  const top = state.results[0];
  const coverage = state.results.filter((item) => item.totalHits > 0);
  const avgCoverage = coverage.length
    ? Math.round(coverage.reduce((sum, item) => sum + item.coverage, 0) / coverage.length)
    : 0;
  $("docCount").textContent = state.docs.length;
  $("wordCount").textContent = totalSignals.toLocaleString();
  $("hotTopic").textContent = top && top.priority ? top.name.split(" ")[0] : "-";
  $("coverageScore").textContent = `${avgCoverage}%`;
}

function renderTopics() {
  $("topicList").innerHTML = state.results
    .filter((topic) => topic.totalHits > 0)
    .slice(0, 10)
    .map(
      (topic) => `
      <article class="topic-card">
        <div class="topic-title">
          <span>${topic.name}</span>
          <span>${topic.priority}%</span>
        </div>
        <div class="bar" aria-hidden="true"><span style="width:${topic.priority}%"></span></div>
        <p>${evidenceSentence(topic)}</p>
        <p><strong>Revision focus:</strong> ${topic.focus}</p>
      </article>
    `
    )
    .join("");
}

function renderChecklist() {
  $("checklistItems").innerHTML = state.checklist
    .map(
      (item) => `
      <li>
        <strong>${item.topic} <span aria-label="priority">(${item.status}, ${item.priority}%)</span></strong>
        <p>${item.action}</p>
        <p>${item.evidence}</p>
      </li>
    `
    )
    .join("");
}

function renderPractice(serverPrompts = null) {
  const prompts = serverPrompts || state.checklist.slice(0, 6).map((item) => practicePrompt(item));
  $("practicePrompts").innerHTML = prompts.length
    ? prompts.map((prompt) => `<div class="practice-item"><p>${prompt}</p></div>`).join("")
    : `<p>Run an analysis first, then generate practice prompts.</p>`;
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function checklistMarkdown() {
  return [
    "# CAIE Computer Science Revision Checklist",
    "",
    ...state.checklist.map(
      (item) => `- [ ] **${item.topic}** (${item.status}, ${item.priority}%) - ${item.action} Evidence: ${item.evidence}`
    )
  ].join("\n");
}

function checklistCsv() {
  const rows = [["topic", "status", "priority", "coverage", "action", "evidence"]];
  state.checklist.forEach((item) => {
    rows.push([item.topic, item.status, item.priority, item.coverage, item.action, item.evidence]);
  });
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function download(filename, content, type) {
  if (!state.checklist.length) {
    analyzeMaterials();
  }
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

if ($("manualText") && $("paperFocus") && $("targetScore")) {
  analyzeMaterials();
}
