const crypto = require("node:crypto");
const { getPrisma, isUniqueConstraintError } = require("./db");
const { readUsersDb, writeUsersDb, memory } = require("./localStore");
const {
  PASSWORD_ALGORITHM,
  PASSWORD_ITERATIONS,
  hashPassword,
  isStrongPassword,
  isValidEmail,
  normaliseEmail,
  verifyPassword
} = require("./auth");

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    username: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    purchased: Boolean(user.purchased)
  };
}

function userHasPaidPurchase(user) {
  return Array.isArray(user.purchases) && user.purchases.some((purchase) => purchase.status === "PAID");
}

function toAppUser(user) {
  if (!user) return null;
  return {
    ...user,
    purchased: Boolean(user.purchased) || userHasPaidPurchase(user)
  };
}

async function findUserByEmail(email) {
  const normalised = normaliseEmail(email);
  const prisma = getPrisma();
  if (prisma) {
    const user = await prisma.user.findFirst({
      where: { email: normalised, deletedAt: null },
      include: { purchases: true, questionSearches: true }
    });
    return toAppUser(user);
  }

  const db = readUsersDb();
  return db.users.find((user) => user.email === normalised) || null;
}

async function findUserById(id) {
  const prisma = getPrisma();
  if (prisma) {
    const user = await prisma.user.findFirst({
      where: { id: String(id || ""), deletedAt: null },
      include: { purchases: true, questionSearches: true }
    });
    return toAppUser(user);
  }

  const db = readUsersDb();
  const user = db.users.find((candidate) => candidate.id === id);
  if (!user) return null;
  const paid = memory.purchases.some((purchase) => purchase.userId === user.id && purchase.status === "PAID");
  return { ...user, purchased: Boolean(user.purchased) || paid };
}

async function createUser(body) {
  const email = normaliseEmail(body.email);
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const password = String(body.password || "");

  if (!isValidEmail(email)) throw httpError("Enter a valid email address.", 400);
  if (!firstName || !lastName) throw httpError("Enter both first name and last name.", 400);
  if (!isStrongPassword(password)) {
    throw httpError("Password must be at least 8 characters and include letters and numbers.", 400);
  }

  const passwordData = hashPassword(password);
  const prisma = getPrisma();
  if (prisma) {
    try {
      const user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          credential: {
            create: {
              passwordHash: passwordData.hash,
              passwordSalt: passwordData.salt,
              passwordAlgorithm: PASSWORD_ALGORITHM,
              passwordIterations: PASSWORD_ITERATIONS
            }
          }
        },
        include: { purchases: true, questionSearches: true }
      });
      return { ok: true, user: publicUser(toAppUser(user)) };
    } catch (error) {
      if (isUniqueConstraintError(error)) throw httpError("This email is already registered.", 409);
      throw error;
    }
  }

  const db = readUsersDb();
  if (db.users.some((user) => user.email === email)) {
    throw httpError("This email is already registered.", 409);
  }

  const user = {
    id: crypto.randomUUID(),
    email,
    firstName,
    lastName,
    passwordHash: passwordData.hash,
    passwordSalt: passwordData.salt,
    passwordAlgorithm: PASSWORD_ALGORITHM,
    passwordIterations: PASSWORD_ITERATIONS,
    purchased: false,
    questionFinderSearches: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.users.push(user);
  writeUsersDb(db);
  return { ok: true, user: publicUser(user) };
}

async function loginUser(body) {
  const email = normaliseEmail(body.email);
  const password = String(body.password || "");
  const prisma = getPrisma();

  if (prisma) {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null, status: "ACTIVE" },
      include: { credential: true, purchases: true, questionSearches: true }
    });
    if (!user) throw httpError("No account exists for this email.", 404);
    if (!verifyPassword(password, user.credential)) throw httpError("Incorrect password.", 401);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      include: { purchases: true, questionSearches: true }
    });
    return { ok: true, user: publicUser(toAppUser(updated)) };
  }

  const db = readUsersDb();
  const user = db.users.find((candidate) => candidate.email === email);
  if (!user) throw httpError("No account exists for this email.", 404);
  if (!verifyPassword(password, user)) throw httpError("Incorrect password.", 401);
  user.lastLoginAt = new Date().toISOString();
  user.updatedAt = new Date().toISOString();
  writeUsersDb(db);
  return { ok: true, user: publicUser(user) };
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  loginUser,
  normaliseEmail,
  isValidEmail,
  publicUser,
  toAppUser
};
