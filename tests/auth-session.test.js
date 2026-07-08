const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const assert = require("node:assert/strict");

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-auth-"));
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
  const setCookie = response.headers.get("set-cookie") || "";
  return setCookie.split(";")[0];
}

const server = http.createServer(handleRequest);

(async () => {
  const port = await listen(server);
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const forgedBody = {
      query: "lossless",
      syllabusIds: ["caie-igcse-0478"],
      userId: "forged-user-id",
      email: "forged@example.com"
    };

    const unauthenticated = await postJson(baseUrl, "/api/question-search", forgedBody);
    assert.equal(unauthenticated.response.status, 200, "guest question search should be allowed");
    assert.equal(unauthenticated.data.access.loggedIn, false, "guest search must not accept forged identity");

    const guestSql = await postJson(baseUrl, "/api/question-search", {
      query: "sql",
      syllabusIds: ["caie-igcse-0478"]
    });
    assert.equal(guestSql.response.status, 200, "guest SQL search should use the server index");
    assert(guestSql.data.matches.length > 10, "SQL search should return the indexed SQL past-paper set, not only manual fallback matches");

    const signup = await postJson(baseUrl, "/api/auth/signup", {
      email: "student@example.com",
      firstName: "Session",
      lastName: "Student",
      password: "Password123"
    });
    assert.equal(signup.response.status, 201, "signup should succeed");
    assert(signup.data.user.id, "signup should return a public user id");
    assert.equal(signup.data.user.passwordHash, undefined, "password hash must not be sent to client");
    assert.equal(signup.data.user.passwordSalt, undefined, "password salt must not be sent to client");

    const forgedRealIdentity = await postJson(baseUrl, "/api/question-search", {
      ...forgedBody,
      userId: signup.data.user.id,
      email: signup.data.user.email
    });
    assert.equal(forgedRealIdentity.response.status, 200, "forged userId/email without session should stay a guest search");
    assert.equal(forgedRealIdentity.data.access.loggedIn, false, "forged userId/email must not create a logged-in search");

    const signupSetCookie = signup.response.headers.get("set-cookie") || "";
    assert.match(signupSetCookie, /HttpOnly/, "session cookie should be HttpOnly");
    assert.match(signupSetCookie, /SameSite=Lax/, "session cookie should use SameSite=Lax");
    const cookie = sessionCookie(signup.response);
    assert(cookie.startsWith("paperlens_session="), "signup should issue a session cookie");

    const access = await postJson(baseUrl, "/api/question-finder/access", {}, cookie);
    assert.equal(access.response.status, 200, "valid session access check should succeed");
    assert.equal(access.data.loggedIn, true, "valid session should be logged in");

    const validSearch = await postJson(baseUrl, "/api/question-search", forgedBody, cookie);
    assert.equal(validSearch.response.status, 200, "valid logged-in session should access protected search");
    assert(Array.isArray(validSearch.data.matches), "protected search should return matches array");

    const logout = await postJson(baseUrl, "/api/auth/logout", {}, cookie);
    assert.equal(logout.response.status, 200, "logout should succeed");
    assert.match(logout.response.headers.get("set-cookie") || "", /Max-Age=0/, "logout should clear the session cookie");
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
