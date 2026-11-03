try {
  require("dotenv").config({ path: require("node:path").resolve(__dirname, "..", ".env") });
} catch (_) {
  // Dotenv is optional
}

const { createApp } = require("./app");

async function startServer() {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || "0.0.0.0";

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  let reportRepository;
  let databaseClient = null;

  if (process.env.DATABASE_URL) {
    try {
      const { PrismaClient } = require("@prisma/client");
      const { PrismaReportRepository } = require("./repositories/prismaReportRepository");
      const prisma = new PrismaClient();
      await prisma.$connect();
      databaseClient = prisma;
      reportRepository = new PrismaReportRepository(prisma);
      console.log("Connected to PostgreSQL via Prisma.");
    } catch (err) {
      console.warn("Database connection failed, falling back to InMemory mode:", err.message);
    }
  } else {
    console.warn("DATABASE_URL not set in backend/.env. Running with InMemory repositories.");
  }

  const server = createApp({
    reportRepository,
    databaseClient,
  }).listen(port, host, () => {
    console.log(`YaşamHattı backend listening on http://${host}:${port}`);
  });

  server.on("close", () => {
    if (databaseClient) {
      databaseClient.$disconnect().catch((error) => {
        console.error("Failed to disconnect from the database:", error.message);
      });
    }
  });

  return server;
}

module.exports = { startServer };
