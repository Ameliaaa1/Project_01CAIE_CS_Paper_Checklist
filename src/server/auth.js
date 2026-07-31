const crypto = require("node:crypto");

const PASSWORD_ALGORITHM = "pbkdf2-sha256";
const PASSWORD_ITERATIONS = 120000;
const SESSION_TOKEN_BYTES = 32;

function normaliseEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(email);
}

function isStrongPassword(password) {
  return typeof password === "string" && password.length >= 8 && /[a-z]/i.test(password) && /\d/.test(password);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex"), iterations = PASSWORD_ITERATIONS) {
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("hex");
  return { salt, hash, algorithm: PASSWORD_ALGORITHM, iterations };
}

function verifyPassword(password, credential) {
  if (!credential?.passwordHash || !credential?.passwordSalt) return false;
  const iterations = Number(credential.passwordIterations || PASSWORD_ITERATIONS);
  const passwordData = hashPassword(password, credential.passwordSalt, iterations);
  const expected = Buffer.from(String(credential.passwordHash), "hex");
  const actual = Buffer.from(passwordData.hash, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function createSecureToken() {
  return crypto.randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

module.exports = {
  PASSWORD_ALGORITHM,
  PASSWORD_ITERATIONS,
  normaliseEmail,
  isValidEmail,
  isStrongPassword,
  hashPassword,
  verifyPassword,
  createSecureToken,
  hashToken
};
