const { spawnSync } = require("node:child_process");
const assert = require("node:assert/strict");

const result = spawnSync(process.execPath, ["-e", "require('./server')"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: "production",
    SESSION_SECRET: "",
    STRIPE_SECRET_KEY: "",
    STRIPE_PRICE_ID: "",
    STRIPE_WEBHOOK_SECRET: "",
    KV_REST_API_URL: "",
    KV_REST_API_TOKEN: "",
    UPSTASH_REDIS_REST_URL: "",
    UPSTASH_REDIS_REST_TOKEN: ""
  },
  encoding: "utf8"
});

assert.notEqual(result.status, 0, "production startup should fail when required configuration is missing");
assert.match(`${result.stderr}${result.stdout}`, /Production configuration is incomplete/);
