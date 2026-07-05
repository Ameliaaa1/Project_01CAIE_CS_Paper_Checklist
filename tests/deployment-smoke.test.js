const { spawnSync } = require("node:child_process");
const http = require("node:http");
const assert = require("node:assert/strict");
const handleRequest = require("../api/index");

const expectedPublic = [
  ["/", 200, /^text\/html/],
  ["/index.html", 200, /^text\/html/],
  ["/app.js", 200, /^text\/javascript/],
  ["/assets/paperlens-data.js", 200, /^text\/javascript/],
  ["/styles.css", 200, /^text\/css/],
  ["/checkout.html", 200, /^text\/html/],
  ["/checkout.js", 200, /^text\/javascript/],
  ["/login.html", 200, /^text\/html/],
  ["/signup.html", 200, /^text\/html/],
  ["/auth.js", 200, /^text\/javascript/],
  ["/auth.css", 200, /^text\/css/],
  ["/assets/study-workspace.png", 200, /^image\/png/],
  ["/textbook_syllabus/pastpaper/2025-March/0478_m25_qp_12.pdf", 200, /^application\/pdf/]
];

const expectedPrivate = [
  "/data/users.json",
  "/data/checkout-sessions.json",
  "/generated/question-index.json",
  "/.env",
  "/.git/config",
  "/server.js",
  "/package.json",
  "/vercel.json"
];

const importResult = spawnSync(
  process.execPath,
  [
    "-e",
    [
      "delete global.document;",
      "delete global.window;",
      "delete global.localStorage;",
      "const handler = require('./api/index');",
      "if (typeof handler !== 'function') throw new Error('API entrypoint did not export a handler');"
    ].join("")
  ],
  { cwd: process.cwd(), env: { ...process.env, NODE_ENV: "test" }, encoding: "utf8" }
);
assert.equal(importResult.status, 0, `${importResult.stderr}${importResult.stdout}`);

const browserResult = spawnSync(process.execPath, ["tests/browser-data-load.test.js"], {
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: "test" },
  encoding: "utf8"
});
assert.equal(browserResult.status, 0, `${browserResult.stderr}${browserResult.stdout}`);

const server = http.createServer(handleRequest);

server.listen(0, "127.0.0.1", async () => {
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    for (const [pathname, status, contentType] of expectedPublic) {
      const response = await fetch(`${baseUrl}${pathname}`);
      assert.equal(response.status, status, `${pathname} returned ${response.status}`);
      assert.match(response.headers.get("content-type") || "", contentType, `${pathname} content type mismatch`);
      await response.arrayBuffer();
    }

    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal(health.status, 200, "/api/health should return 200");
    assert.equal((await health.json()).ok, true, "/api/health should report ok");

    const session = await fetch(`${baseUrl}/api/auth/session`, { method: "POST" });
    assert.equal(session.status, 401, "/api/auth/session without a cookie should fail cleanly");
    assert.match((await session.json()).error || "", /Log in/i);

    for (const pathname of expectedPrivate) {
      const response = await fetch(`${baseUrl}${pathname}`);
      assert(
        response.status === 403 || response.status === 404,
        `${pathname} returned ${response.status}; expected 403 or 404`
      );
    }
  } finally {
    server.close();
  }
});
