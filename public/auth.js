const accessStorageKey = "paperlensAccess";

const authMessage = document.getElementById("authMessage");
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const signupPassword = document.getElementById("signupPassword");

document.getElementById("checkEmailButton")?.addEventListener("click", checkSignupEmail);
document.getElementById("nameContinueButton")?.addEventListener("click", continueToPassword);
document.getElementById("checkLoginEmailButton")?.addEventListener("click", checkLoginEmail);
signupPassword?.addEventListener("input", () => updatePasswordRules(signupPassword.value));
signupForm?.addEventListener("submit", createAccount);
loginForm?.addEventListener("submit", logIn);
document.querySelectorAll("[data-back-to]").forEach((button) => {
  button.addEventListener("click", () => showStep(button.dataset.backTo));
});

async function checkSignupEmail() {
  const email = document.getElementById("signupEmail").value.trim();
  setMessage("");
  if (!isValidEmail(email)) {
    setMessage("Enter a valid email address.", true);
    return;
  }

  const result = await postJson("/api/auth/check-email", { email });
  if (!result.ok) {
    setMessage(result.error, true);
    return;
  }
  if (result.data.registered) {
    setMessage("This email is already registered. Log in instead.", true);
    return;
  }

  showStep("nameStep");
  document.getElementById("firstNameInput").focus();
}

async function checkLoginEmail() {
  const email = document.getElementById("loginEmail").value.trim();
  setMessage("");
  if (!isValidEmail(email)) {
    setMessage("Enter a valid email address.", true);
    return;
  }

  const result = await postJson("/api/auth/check-email", { email });
  if (!result.ok) {
    setMessage(loginEmailCheckMessage(result.error), true);
    return;
  }
  if (!result.data.registered) {
    setMessage("No account exists for this email. Please sign up first.", true);
    return;
  }

  showStep("loginPasswordStep");
  document.getElementById("loginPassword").focus();
}

function continueToPassword() {
  const firstName = document.getElementById("firstNameInput").value.trim();
  const lastName = document.getElementById("lastNameInput").value.trim();
  setMessage("");
  if (!firstName || !lastName) {
    setMessage("Enter both first name and last name.", true);
    return;
  }
  showStep("passwordStep");
  document.getElementById("signupPassword").focus();
  updatePasswordRules(document.getElementById("signupPassword").value);
}

async function createAccount(event) {
  event.preventDefault();
  const payload = {
    email: document.getElementById("signupEmail").value.trim(),
    firstName: document.getElementById("firstNameInput").value.trim(),
    lastName: document.getElementById("lastNameInput").value.trim(),
    password: document.getElementById("signupPassword").value
  };

  if (!isStrongPassword(payload.password)) {
    setMessage("Password must be at least 8 characters and include letters and numbers.", true);
    return;
  }

  const result = await postJson("/api/auth/signup", payload);
  if (!result.ok) {
    setMessage(result.error, true);
    return;
  }

  saveSession(result.data.user);
  setMessage("Account created. Opening PaperLens.");
  window.setTimeout(() => {
    window.location.href = "index.html#igcse-0478";
  }, 700);
}

async function logIn(event) {
  event.preventDefault();
  const payload = {
    email: document.getElementById("loginEmail").value.trim(),
    password: document.getElementById("loginPassword").value
  };

  const result = await postJson("/api/auth/login", payload);
  if (!result.ok) {
    setMessage(result.error, true);
    return;
  }

  saveSession(result.data.user);
  setMessage("Logged in. Taking you back to PaperLens.");
  window.setTimeout(() => {
    window.location.href = "index.html#igcse-0478";
  }, 700);
}

function showStep(stepId) {
  document.querySelectorAll(".auth-step").forEach((step) => {
    step.hidden = step.id !== stepId;
  });
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

function loginEmailCheckMessage(error) {
  if (/persistent storage is not configured/i.test(error || "")) {
    return "No account exists for this email. Please sign up first.";
  }
  return error;
}

function updatePasswordRules(password) {
  const rules = {
    length: password.length >= 8,
    letter: /[a-z]/i.test(password),
    number: /\d/.test(password)
  };

  document.querySelectorAll(".password-rule").forEach((rule) => {
    rule.classList.toggle("is-met", Boolean(rules[rule.dataset.rule]));
  });
}

function isValidEmail(email) {
  return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(email);
}

function isStrongPassword(password) {
  return password.length >= 8 && /[a-z]/i.test(password) && /\d/.test(password);
}
