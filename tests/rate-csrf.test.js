const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const assert = require("node:assert/strict");

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-rate-csrf-"));
process.env.SESSION_SECRET = "test-session-secret";

const handleRequest = require("../server");

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

async function postJson(baseUrl, pathname, body, headers = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
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
      email: "csrf@example.com",
      firstName: "Csrf",
      lastName: "Tester",
      password: "Password123"
    });
    assert.equal(signup.response.status, 201);
    const cookie = sessionCookie(signup.response);

    const missingOrigin = await postJson(
      baseUrl,
      "/api/question-search",
      { query: "lossless", syllabusIds: ["caie-igcse-0478"] },
      { Cookie: cookie }
    );
    assert.equal(missingOrigin.response.status, 403, "authenticated POST without Origin should fail CSRF check");

    const wrongOrigin = await postJson(
      baseUrl,
      "/api/question-search",
      { query: "lossless", syllabusIds: ["caie-igcse-0478"] },
      { Cookie: cookie, Origin: "https://evil.example" }
    );
    assert.equal(wrongOrigin.response.status, 403, "authenticated POST with wrong Origin should fail CSRF check");

    let lastResponse = null;
    for (let index = 0; index < 31; index += 1) {
      lastResponse = await postJson(baseUrl, "/api/auth/check-email", { email: `rate${index}@example.com` });
    }
    assert.equal(lastResponse.response.status, 429, "auth endpoints should be rate limited");
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
