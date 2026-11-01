const { spawnSync } = require("node:child_process");

const result = spawnSync(
  process.execPath,
  ["--test", "test/database.integration.js"],
  {
    stdio: "inherit",
    env: { ...process.env, RUN_DATABASE_TESTS: "1" },
  },
);

if (result.error) {
  console.error("Failed to start database integration tests:", result.error);
}

process.exitCode = result.status ?? 1;
