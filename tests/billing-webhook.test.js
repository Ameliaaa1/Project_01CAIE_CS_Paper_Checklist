const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-billing-"));
process.env.SESSION_SECRET = "test-session-secret";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
process.env.STRIPE_CHECKOUT_MOCK = "1";

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

async function getJson(baseUrl, pathname, cookie = "") {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  const response = await fetch(`${baseUrl}${pathname}`, { headers });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function postStripeWebhook(baseUrl, event, secret = process.env.STRIPE_WEBHOOK_SECRET) {
  const rawBody = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const response = await fetch(`${baseUrl}/api/billing/stripe-webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": `t=${timestamp},v1=${signature}`
    },
    body: rawBody
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
      email: "buyer@example.com",
      firstName: "Billing",
      lastName: "Buyer",
      password: "Password123"
    });
    assert.equal(signup.response.status, 201);
    const cookie = sessionCookie(signup.response);

    const checkout = await postJson(baseUrl, "/api/billing/create-checkout", {}, cookie);
    assert.equal(checkout.response.status, 200);
    assert.equal(checkout.data.status, "pending");
    const sessionId = checkout.data.sessionId;

    const directComplete = await postJson(baseUrl, "/api/billing/complete", { sessionId }, cookie);
    assert.equal(directComplete.response.status, 410, "client-controlled checkout completion should be disabled");

    const pendingStatus = await getJson(baseUrl, `/api/billing/status?session=${encodeURIComponent(sessionId)}`, cookie);
    assert.equal(pendingStatus.response.status, 200);
    assert.equal(pendingStatus.data.status, "pending");
    assert.equal(pendingStatus.data.user.purchased, false);

    const event = {
      id: "evt_valid_checkout_completed",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          payment_status: "paid",
          metadata: {
            paperlensCheckoutSessionId: sessionId
          }
        }
      }
    };

    const invalidWebhook = await postStripeWebhook(baseUrl, event, "wrong_secret");
    assert.equal(invalidWebhook.response.status, 400, "invalid Stripe signature should fail");

    const stillPending = await getJson(baseUrl, `/api/billing/status?session=${encodeURIComponent(sessionId)}`, cookie);
    assert.equal(stillPending.data.status, "pending", "invalid webhook must not activate access");

    const validWebhook = await postStripeWebhook(baseUrl, event);
    assert.equal(validWebhook.response.status, 200, "valid Stripe webhook should be accepted");

    const paidStatus = await getJson(baseUrl, `/api/billing/status?session=${encodeURIComponent(sessionId)}`, cookie);
    assert.equal(paidStatus.response.status, 200);
    assert.equal(paidStatus.data.status, "paid");
    assert.equal(paidStatus.data.user.purchased, true);
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
