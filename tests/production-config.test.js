const { spawnSync } = require("node:child_process");
const assert = require("node:assert/strict");

const productionEnv = {
  ...process.env,
  NODE_ENV: "production",
  SESSION_SECRET: "",
  STRIPE_SECRET_KEY: "",
  STRIPE_PRICE_ID: "",
  STRIPE_WEBHOOK_SECRET: "",
  STRIPE_CHECKOUT_MOCK: "",
  KV_REST_API_URL: "",
  KV_REST_API_TOKEN: "",
  UPSTASH_REDIS_REST_URL: "",
  UPSTASH_REDIS_REST_TOKEN: ""
};

const missingSession = spawnSync(process.execPath, ["-e", "require('./server')"], {
  cwd: process.cwd(),
  env: productionEnv,
  encoding: "utf8"
});

assert.notEqual(missingSession.status, 0, "production startup should fail when SESSION_SECRET is missing");
assert.match(`${missingSession.stderr}${missingSession.stdout}`, /SESSION_SECRET/);

const shortSession = spawnSync(process.execPath, ["-e", "require('./server')"], {
  cwd: process.cwd(),
  env: {
    ...productionEnv,
    SESSION_SECRET: "too-short"
  },
  encoding: "utf8"
});

assert.notEqual(shortSession.status, 0, "production startup should fail when SESSION_SECRET is too short");
assert.match(`${shortSession.stderr}${shortSession.stdout}`, /SESSION_SECRET with at least 32 characters/);

const previewBoot = spawnSync(
  process.execPath,
  [
    "-e",
    `
      const http = require("node:http");
      const assert = require("node:assert/strict");
      const handleRequest = require("./api/index");
      const server = http.createServer(handleRequest);
      server.listen(0, "127.0.0.1", async () => {
        const baseUrl = "http://127.0.0.1:" + server.address().port;
        try {
          const health = await fetch(baseUrl + "/api/health");
          assert.equal(health.status, 200);

          const home = await fetch(baseUrl + "/");
          assert.equal(home.status, 200);

          const storage = await fetch(baseUrl + "/api/auth/check-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "preview@example.com" })
          });
          assert.equal(storage.status, 503);
          assert.match((await storage.json()).error, /Persistent storage is not configured/);

          const webhook = await fetch(baseUrl + "/api/billing/stripe-webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: "evt_preview", type: "checkout.session.completed", data: { object: {} } })
          });
          assert.equal(webhook.status, 503);
          assert.match((await webhook.json()).error, /Stripe webhook secret is not configured/);
        } finally {
          server.close();
        }
      }).on("close", () => process.exit(0));
      setTimeout(() => {
        server.close();
        process.exit(1);
      }, 5000);
    `
  ],
  {
    cwd: process.cwd(),
    env: {
      ...productionEnv,
      SESSION_SECRET: "preview-session-secret-32-characters"
    },
    encoding: "utf8"
  }
);

assert.equal(previewBoot.status, 0, `${previewBoot.stderr}${previewBoot.stdout}`);
