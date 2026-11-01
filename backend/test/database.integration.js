require("dotenv").config({ path: require("node:path").resolve(__dirname, "..", ".env") });

const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { test } = require("node:test");
const { PrismaClient } = require("@prisma/client");
const { createApp } = require("../src/app");
const { PrismaReportRepository } = require("../src/repositories/prismaReportRepository");

test(
  "PostgreSQL accepts guest reports and deduplicates retries",
  { skip: process.env.RUN_DATABASE_TESTS !== "1" },
  async (t) => {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL must be set in backend/.env or the environment.");

  const prisma = new PrismaClient();
  const clientReportId = `database-integration-${randomUUID()}`;
  const latitude = 89 + Math.floor(Math.random() * 1_000_000) / 100_000_000;
  const longitude = 179 + Math.floor(Math.random() * 1_000_000) / 100_000_000;
  let server;

  try {
    await prisma.$connect();
    server = createApp({
      reportRepository: new PrismaReportRepository(prisma),
      databaseClient: prisma,
    }).listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const healthResponse = await fetch(`${baseUrl}/api/v1/health`);
    const health = await healthResponse.json();

    assert.equal(healthResponse.status, 200);
    assert.equal(health.database, "connected");

    const payload = {
      clientReportId,
      type: "accident",
      occurredAt: "2099-01-02T03:04:05.000Z",
      location: { latitude, longitude },
      description: "Database integration test",
    };
    const createResponse = await fetch(`${baseUrl}/api/v1/reports`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const created = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(created.data.clientReportId, clientReportId);
    assert.equal(created.data.type, payload.type);
    assert.equal(created.data.description, payload.description);
    assert.equal(created.duplicate, false);

    const duplicateResponse = await fetch(`${baseUrl}/api/v1/reports`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const duplicate = await duplicateResponse.json();

    assert.equal(duplicateResponse.status, 200);
    assert.equal(duplicate.data.id, created.data.id);
    assert.equal(duplicate.duplicate, true);

    const persisted = await prisma.report.findUnique({
      where: { client_report_id: clientReportId },
    });
    assert.equal(persisted.status_type, "new");
  } finally {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }

    await prisma.report.deleteMany({
      where: { client_report_id: clientReportId },
    });
    await prisma.$disconnect();
  }
  },
);
