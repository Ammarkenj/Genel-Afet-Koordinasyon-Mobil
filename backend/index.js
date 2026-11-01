const { startServer } = require("./src/server");

startServer().catch((error) => {
  console.error("Failed to start YaşamHattı backend:", error);
  process.exitCode = 1;
});
