const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const assert = require("node:assert/strict");

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-question-search-"));
process.env.SESSION_SECRET = "test-session-secret";

const handleRequest = require("../server");

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

async function postJson(baseUrl, pathname, body, cookie = "") {
  const headers = { "Content-Type": "application/json" };
  if (cookie) {
    headers.Cookie = cookie;
    headers.Origin = baseUrl;
  }
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

function sessionCookie(response) {
  return (response.headers.get("set-cookie") || "").split(";")[0];
}

const server = http.createServer(handleRequest);

(async () => {
  const port = await listen(server);
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const signup = await postJson(baseUrl, "/api/auth/signup", {
      email: "search@example.com",
      firstName: "Search",
      lastName: "Student",
      password: "Password123"
    });
    assert.equal(signup.response.status, 201);
    const cookie = sessionCookie(signup.response);

    const first = await postJson(baseUrl, "/api/question-search", {
      query: "database",
      syllabusIds: ["caie-igcse-0478"]
    }, cookie);
    assert.equal(first.response.status, 200);
    assert.equal(first.data.trialConsumed, true, "first unique search should consume trial");
    assert(first.data.searchId, "search should be recorded");
    assert.equal(first.data.access.used, 1);

    const repeat = await postJson(baseUrl, "/api/question-search", {
      query: "database",
      syllabusIds: ["caie-igcse-0478"]
    }, cookie);
    assert.equal(repeat.response.status, 200);
    assert.equal(repeat.data.trialConsumed, false, "repeat search should not consume another trial");
    assert.equal(repeat.data.access.used, 1);

    const unsupportedSyllabus = await postJson(baseUrl, "/api/question-search", {
      query: "coefficient expansion",
      syllabusIds: ["caie-as-a-level-9709"]
    }, cookie);
    assert.equal(unsupportedSyllabus.response.status, 400);

    const db = JSON.parse(fs.readFileSync(path.join(process.env.DATA_DIR, "users.json"), "utf8"));
    const user = db.users.find((candidate) => candidate.email === "search@example.com");
    assert.equal(user.questionFinderSearches.length, 1, "Only supported QuestionSearch records should be persisted in the store");
  } finally {
    server.close();
    fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
  }
})().catch((error) => {
  server.close();
  fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
  console.error(error);
  process.exitCode = 1;
});
