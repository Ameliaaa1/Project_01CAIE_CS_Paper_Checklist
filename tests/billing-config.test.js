const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const assert = require("node:assert/strict");

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-billing-config-"));
process.env.SESSION_SECRET = "test-session-secret";
process.env.STRIPE_SECRET_KEY = "";
process.env.STRIPE_PRICE_ID = "";
process.env.STRIPE_WEBHOOK_SECRET = "";
process.env.STRIPE_CHECKOUT_MOCK = "";

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
      email: "stripe-missing@example.com",
      firstName: "Stripe",
      lastName: "Missing",
      password: "Password123"
    });
    assert.equal(signup.response.status, 201);

    const checkout = await postJson(baseUrl, "/api/billing/create-checkout", {}, sessionCookie(signup.response));
    assert.equal(checkout.response.status, 503);
    assert.match(checkout.data.error, /Stripe Checkout is not configured/);
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
