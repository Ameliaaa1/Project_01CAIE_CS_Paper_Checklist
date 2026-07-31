"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

process.env.DATA_DIR = fs.mkdtempSync(
  path.join(os.tmpdir(), "paperlens-provider-disabled-")
);
process.env.SESSION_SECRET = "provider-disabled-test-session";
process.env.BILLING_PROVIDER_ENABLED = "false";
process.env.BILLING_ENVIRONMENT = "DISABLED";

const handleRequest = require("../server");
const { memory, resetMemoryStore } = require("../src/server/localStore");
const { getUserPurchaseStatus } = require("../src/server/purchases");

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

const server = http.createServer(handleRequest);

(async () => {
  const port = await listen(server);
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    for (const request of [
      { path: "/api/billing/create-checkout", method: "POST" },
      { path: "/api/billing/stripe-webhook", method: "POST" },
      { path: "/api/billing/status?session=inactive", method: "GET" },
      { path: "/checkout.html", method: "GET" },
      { path: "/checkout.js", method: "GET" }
    ]) {
      const response = await fetch(`${baseUrl}${request.path}`, {
        method: request.method,
        headers: { "Content-Type": "application/json" },
        body: request.method === "POST" ? "{}" : undefined
      });
      assert(
        [403, 404].includes(response.status),
        `${request.path} must be unavailable`
      );
    }

    const activeFiles = [
      "server.js",
      "public/app.js",
      "public/index.html",
      "public/auth.js",
      ".env.example",
      "src/server/purchases.js"
    ];
    for (const file of activeFiles) {
      const text = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
      assert.doesNotMatch(text, /stripe/i, `${file} must not contain Stripe runtime`);
    }
    assert.equal(fs.existsSync(path.join(__dirname, "../public/checkout.html")), false);
    assert.equal(fs.existsSync(path.join(__dirname, "../public/checkout.js")), false);

    resetMemoryStore();
    memory.purchases.push({
      id: "provider-neutral-entitlement",
      userId: "provider-neutral-user",
      provider: "TEST",
      status: "PAID",
      amount: 0,
      currency: "CNY",
      purchasedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
    const entitlement = await getUserPurchaseStatus("provider-neutral-user");
    assert.equal(entitlement.hasPaidEntitlement, true);
    assert.equal(entitlement.paidPurchaseCount, 1);
  } finally {
    server.close();
    fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
    resetMemoryStore();
  }
})().catch((error) => {
  server.close();
  fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
  console.error(error);
  process.exitCode = 1;
});
