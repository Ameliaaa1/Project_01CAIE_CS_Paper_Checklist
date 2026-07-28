const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { runMigration } = require("../scripts/website-pdf-dependency-migration");

const rootDir = path.resolve(__dirname, "..");
const result = runMigration({ build: false, quiet: true });

assert.equal(result.report.status, "PASS", JSON.stringify(result.debug.dependencyAudit.violations));
assert.equal(result.debug.integrity.serverEqualsProductionAdapter, true);
assert.equal(result.debug.integrity.browserEqualsServer, true);
assert.equal(result.debug.integrity.missingReferences.length, 0);
assert.deepEqual(result.report.counts.bySyllabus, {
  "caie-igcse-0478": 808,
  "caie-as-a-level-9618": 882,
  "caie-as-a-level-9709": 55
});

const vercel = JSON.parse(fs.readFileSync(path.join(rootDir, "vercel.json"), "utf8"));
const includeFiles = vercel.functions["api/index.js"].includeFiles;
assert.doesNotMatch(includeFiles, /\.pdf|pastpaper/, "serverless function must not bundle source PDFs");
assert.match(includeFiles, /production-question-index\.json/);

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "paperlens-website-migration-"));
process.env.SESSION_SECRET = "website-migration-test-session-secret";
const handleRequest = require("../server");
const sample = result.debug.samples["caie-igcse-0478"];
const server = http.createServer(handleRequest);

server.listen(0, "127.0.0.1", async () => {
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal(health.status, 200);

    const source = await fetch(`${baseUrl}${sample.sourceReferences.questionPaper.url}`);
    assert.equal(source.status, 200);
    assert.match(source.headers.get("content-type") || "", /application\/pdf/);

    const signup = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "migration@example.com", firstName: "Migration", lastName: "Test", password: "Password123" })
    });
    assert.equal(signup.status, 201);
    const cookie = (signup.headers.get("set-cookie") || "").split(";")[0];
    const search = await fetch(`${baseUrl}/api/question-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie, Origin: baseUrl },
      body: JSON.stringify({ query: "database", syllabusIds: ["caie-igcse-0478"] })
    });
    const searchPayload = await search.json();
    assert.equal(search.status, 200);
    assert.ok(searchPayload.matches.length > 0);

    const searchedQuestion = searchPayload.matches[0];
    const preview = await fetch(`${baseUrl}/api/question-preview?id=${encodeURIComponent(searchedQuestion.id)}&type=qp`, {
      headers: { Cookie: cookie },
      redirect: "manual"
    });
    assert.equal(preview.status, 302);
    assert.equal(preview.headers.get("location"), `${searchedQuestion.sourceReferences.questionPaper.url}#page=${searchedQuestion.sourceReferences.questionPaper.pageStart}`);

    const practicePdf = await fetch(`${baseUrl}/api/question-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie, Origin: baseUrl },
      body: JSON.stringify({ questionIds: [searchPayload.matches[0].id], query: "database", includeMarkScheme: true })
    });
    assert.equal(practicePdf.status, 200);
    assert.match(practicePdf.headers.get("content-type") || "", /application\/pdf/);
    const pdfBytes = Buffer.from(await practicePdf.arrayBuffer());
    assert.equal(pdfBytes.subarray(0, 4).toString(), "%PDF");
    process.stdout.write("Website PDF dependency migration tests passed.\n");
  } finally {
    server.close();
    fs.rmSync(process.env.DATA_DIR, { recursive: true, force: true });
  }
}).on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
