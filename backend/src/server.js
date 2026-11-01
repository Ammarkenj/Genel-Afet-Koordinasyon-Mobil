require("dotenv").config({ path: require("node:path").resolve(__dirname, "..", ".env") });

const { PrismaClient } = require("@prisma/client");
const { createApp } = require("./app");
const { PrismaReportRepository } = require("./repositories/prismaReportRepository");

async function startServer() {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || "0.0.0.0";

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set in backend/.env or the environment.");
  }

  const prisma = new PrismaClient();
  await prisma.$connect();

  const server = createApp({
    reportRepository: new PrismaReportRepository(prisma),
    databaseClient: prisma,
  }).listen(port, host, () => {
    console.log(`YaşamHattı backend listening on http://${host}:${port}`);
  });

  server.on("close", () => {
    prisma.$disconnect().catch((error) => {
      console.error("Failed to disconnect from the database:", error.message);
    });
  });

  return server;
}

module.exports = { startServer };
