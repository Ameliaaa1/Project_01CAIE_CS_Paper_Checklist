const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const assert = require("node:assert/strict");

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-migration-"));
fs.writeFileSync(path.join(dataDir, "users.json"), JSON.stringify({
  users: [
    {
      id: "legacy-one",
      email: "legacy@example.com",
      firstName: "Legacy",
      lastName: "One",
      passwordHash: "hash",
      passwordSalt: "salt",
      purchased: true,
      purchasedAt: "2026-01-01T00:00:00.000Z",
      checkoutSessionId: "checkout-one",
      questionFinderSearches: [
        {
          id: "search-one",
          key: "search-key",
          query: "database",
          syllabusIds: ["caie-igcse-0478"],
          questionIds: ["q1", "q2"],
          createdAt: "2026-01-02T00:00:00.000Z"
        }
      ],
      createdAt: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "legacy-two",
      email: " LEGACY@example.com ",
      firstName: "Legacy",
      lastName: "Two",
      passwordHash: "hash",
      passwordSalt: "salt",
      createdAt: "2026-01-03T00:00:00.000Z"
    }
  ]
}, null, 2));

const result = spawnSync(process.execPath, ["scripts/migrate-users-to-prisma.js", "--dry-run"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    DATA_DIR: dataDir,
    DATABASE_URL: ""
  },
  encoding: "utf8"
});

fs.rmSync(dataDir, { recursive: true, force: true });

assert.equal(result.status, 0, result.stderr || result.stdout);
const report = JSON.parse(result.stdout);
assert.equal(report.dryRun, true);
assert.equal(report.totalLegacyUsers, 2);
assert.equal(report.duplicateEmails.length, 1, "duplicate emails should be reported in dry run");
