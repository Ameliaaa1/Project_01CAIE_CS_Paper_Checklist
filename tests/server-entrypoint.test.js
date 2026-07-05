const { spawnSync } = require("node:child_process");
const assert = require("node:assert/strict");

const result = spawnSync(
  process.execPath,
  [
    "-e",
    [
      "global.document = undefined;",
      "global.window = undefined;",
      "global.localStorage = undefined;",
      "const handler = require('./api/index');",
      "if (typeof handler !== 'function') throw new Error('API entrypoint did not export a handler');"
    ].join("")
  ],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "test"
    },
    encoding: "utf8"
  }
);

assert.equal(result.status, 0, `${result.stderr}${result.stdout}`);
