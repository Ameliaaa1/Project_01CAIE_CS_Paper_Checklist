const accessStorageKey = "paperlensAccess";
const authMessage = document.getElementById("authMessage");
const completeButton = document.getElementById("completeCheckoutButton");

completeButton?.addEventListener("click", completeCheckout);

async function completeCheckout() {
  const sessionId = new URLSearchParams(window.location.search).get("session");
  if (!sessionId) {
    setMessage("Payment link is missing a checkout session.", true);
    return;
  }

  const result = await postJson("/api/billing/complete", { sessionId });
  if (!result.ok) {
    setMessage(result.error, true);
    return;
  }

  saveSession(result.data.user);
  setMessage("Payment confirmed. Your lifetime access is active.");
  window.setTimeout(() => {
    window.location.href = "index.html#igcse-0478";
  }, 900);
}

async function postJson(url, body) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    return response.ok ? { ok: true, data } : { ok: false, error: data.error || "Something went wrong." };
  } catch {
    return { ok: false, error: "Could not reach the server." };
  }
}

function saveSession(user) {
  localStorage.setItem(
    accessStorageKey,
    JSON.stringify({
      loggedIn: true,
      purchased: Boolean(user.purchased),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    })
  );
}

function setMessage(message, isError = false) {
  if (!authMessage) return;
  authMessage.textContent = message;
  authMessage.classList.toggle("is-error", isError);
}
