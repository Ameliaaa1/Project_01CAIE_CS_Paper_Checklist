const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const assert = require("node:assert/strict");

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-auth-db-"));
process.env.SESSION_SECRET = "test-session-secret";

const { memory } = require("../src/server/localStore");
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
      email: "  STUDENT@example.com ",
      firstName: "Auth",
      lastName: "Student",
      password: "Password123"
    });
    assert.equal(signup.response.status, 201, "registration should succeed");
    assert.equal(signup.data.user.email, "student@example.com", "email should be normalized");
    assert(sessionCookie(signup.response).startsWith("paperlens_session="), "signup should create a session cookie");

    const duplicate = await postJson(baseUrl, "/api/auth/signup", {
      email: "student@example.com",
      firstName: "Auth",
      lastName: "Duplicate",
      password: "Password123"
    });
    assert.equal(duplicate.response.status, 409, "duplicate email registration should fail");

    const wrongPassword = await postJson(baseUrl, "/api/auth/login", {
      email: "student@example.com",
      password: "Wrong12345"
    });
    assert.equal(wrongPassword.response.status, 401, "wrong password should fail");

    const login = await postJson(baseUrl, "/api/auth/login", {
      email: "student@example.com",
      password: "Password123"
    });
    assert.equal(login.response.status, 200, "login should succeed");
    const cookie = sessionCookie(login.response);
    assert(cookie.startsWith("paperlens_session="), "login should create a session cookie");

    const logout = await postJson(baseUrl, "/api/auth/logout", {}, cookie);
    assert.equal(logout.response.status, 200, "logout should revoke session");
    const revoked = await postJson(baseUrl, "/api/auth/session", {}, cookie);
    assert.equal(revoked.response.status, 401, "revoked session should be rejected");

    const loginAgain = await postJson(baseUrl, "/api/auth/login", {
      email: "student@example.com",
      password: "Password123"
    });
    const expiringCookie = sessionCookie(loginAgain.response);
    const tokenHash = require("../src/server/auth").hashToken(expiringCookie.split("=")[1]);
    const session = memory.sessions.find((candidate) => candidate.tokenHash === tokenHash);
    session.expiresAt = new Date(Date.now() - 1000).toISOString();
    const expired = await postJson(baseUrl, "/api/auth/session", {}, expiringCookie);
    assert.equal(expired.response.status, 401, "expired session should be rejected");
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
