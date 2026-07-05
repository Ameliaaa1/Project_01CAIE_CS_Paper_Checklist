const accessStorageKey = "paperlensAccess";
const authMessage = document.getElementById("authMessage");
const refreshButton = document.getElementById("refreshCheckoutStatusButton");

refreshButton?.addEventListener("click", refreshCheckoutStatus);
refreshCheckoutStatus();

async function refreshCheckoutStatus() {
  const sessionId = new URLSearchParams(window.location.search).get("session");
  if (!sessionId) {
    setMessage("Payment link is missing a checkout session.", true);
    return;
  }

  setMessage("Checking payment status...");
  const result = await getJson(`/api/billing/status?session=${encodeURIComponent(sessionId)}`);
  if (!result.ok) {
    setMessage(result.error, true);
    return;
  }

  if (result.data.user) saveSession(result.data.user);
  if (result.data.paid) {
    setMessage("Payment confirmed by provider. Your lifetime access is active.");
    window.setTimeout(() => {
      window.location.href = "index.html#igcse-0478";
    }, 900);
    return;
  }

  setMessage("Payment is still pending. Refresh after completing payment with the provider.");
}

async function getJson(url) {
  try {
    const response = await fetch(url);
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
