const http = require("node:http");
const assert = require("node:assert/strict");
const handleRequest = require("../server");

const privatePaths = [
  "/data/users.json",
  "/data/checkout-sessions.json",
  "/generated/question-index.json",
  "/.env",
  "/.env.local",
  "/.git/config",
  "/server.js",
  "/vercel.json",
  "/package.json",
  "/package-lock.json",
  "/pnpm-lock.yaml",
  "/yarn.lock",
  "/node_modules/pdf-lib/package.json"
];

const server = http.createServer(handleRequest);

server.listen(0, "127.0.0.1", async () => {
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    for (const pathname of privatePaths) {
      const response = await fetch(`${baseUrl}${pathname}`);
      assert(
        response.status === 403 || response.status === 404,
        `${pathname} returned ${response.status}; expected 403 or 404`
      );
    }

    const publicResponse = await fetch(`${baseUrl}/index.html`);
    assert.equal(publicResponse.status, 200, "index.html should remain publicly served");

    const dataResponse = await fetch(`${baseUrl}/data/paperlens-data.js`);
    assert.equal(dataResponse.status, 200, "shared browser data should be publicly served");
    assert.match(await dataResponse.text(), /PaperLensData/, "shared browser data should assign PaperLensData");
  } finally {
    server.close();
  }
});
