const fs = require("node:fs");
const path = require("node:path");

const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), "data");
const usersDbPath = path.join(dataDir, "users.json");

const memory = {
  sessions: [],
  purchases: []
};

function ensureUserDatabase() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(usersDbPath)) {
    fs.writeFileSync(usersDbPath, JSON.stringify({ users: [] }, null, 2));
  }
}

function readUsersDb() {
  ensureUserDatabase();
  try {
    const db = JSON.parse(fs.readFileSync(usersDbPath, "utf8"));
    return { users: Array.isArray(db.users) ? db.users : [] };
  } catch {
    return { users: [] };
  }
}

function writeUsersDb(db) {
  ensureUserDatabase();
  fs.writeFileSync(usersDbPath, JSON.stringify({ users: Array.isArray(db.users) ? db.users : [] }, null, 2));
}

function resetMemoryStore() {
  memory.sessions = [];
  memory.purchases = [];
}

module.exports = {
  memory,
  readUsersDb,
  writeUsersDb,
  resetMemoryStore
};
