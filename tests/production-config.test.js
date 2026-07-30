const { spawnSync } = require("node:child_process");
const assert = require("node:assert/strict");

const productionEnv = {
  ...process.env,
  NODE_ENV: "production",
  DATABASE_URL: "",
  SESSION_SECRET: "",
  BILLING_PROVIDER_ENABLED: "false",
  BILLING_ENVIRONMENT: "DISABLED",
  KV_REST_API_URL: "",
  KV_REST_API_TOKEN: "",
  UPSTASH_REDIS_REST_URL: "",
  UPSTASH_REDIS_REST_TOKEN: ""
};

const missingDatabase = spawnSync(process.execPath, ["-e", "require('./server')"], {
  cwd: process.cwd(),
  env: productionEnv,
  encoding: "utf8"
});

assert.notEqual(missingDatabase.status, 0, "production startup should fail when DATABASE_URL is missing");
assert.match(`${missingDatabase.stderr}${missingDatabase.stdout}`, /DATABASE_URL/);

const missingSession = spawnSync(process.execPath, ["-e", "require('./server')"], {
  cwd: process.cwd(),
  env: {
    ...productionEnv,
    DATABASE_URL: "postgres://paperlens:paperlens@localhost:5432/paperlens"
  },
  encoding: "utf8"
});

assert.notEqual(missingSession.status, 0, "production startup should fail when SESSION_SECRET is missing");
assert.match(`${missingSession.stderr}${missingSession.stdout}`, /SESSION_SECRET/);

const shortSession = spawnSync(process.execPath, ["-e", "require('./server')"], {
  cwd: process.cwd(),
  env: {
    ...productionEnv,
    DATABASE_URL: "postgres://paperlens:paperlens@localhost:5432/paperlens",
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

          const paymentEndpoint = await fetch(baseUrl + "/api/billing/provider-callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
          });
          assert.equal(paymentEndpoint.status, 404);
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
      DATABASE_URL: "postgres://paperlens:paperlens@localhost:5432/paperlens",
      SESSION_SECRET: "preview-session-secret-32-characters"
    },
    encoding: "utf8"
  }
);

assert.equal(previewBoot.status, 0, `${previewBoot.stderr}${previewBoot.stdout}`);
