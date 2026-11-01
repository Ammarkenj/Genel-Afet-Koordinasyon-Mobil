require("dotenv").config({ path: require("node:path").resolve(__dirname, "..", ".env") });

const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { test } = require("node:test");
const { PrismaClient } = require("@prisma/client");
const { createApp } = require("../src/app");
const { PrismaReportRepository } = require("../src/repositories/prismaReportRepository");

test(
  "PostgreSQL persists and serves reports through the API",
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

    const filters = new URLSearchParams({
      status: "new",
      startDate: payload.occurredAt,
      endDate: payload.occurredAt,
      minLat: String(latitude),
      maxLat: String(latitude),
      minLon: String(longitude),
      maxLon: String(longitude),
      limit: "1",
    });
    const listResponse = await fetch(`${baseUrl}/api/v1/reports?${filters}`);
    const list = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(list.pagination.total, 1);
    assert.equal(list.data[0].id, created.data.id);

    const updateResponse = await fetch(`${baseUrl}/api/v1/reports/${created.data.id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "reviewing" }),
    });
    const updated = await updateResponse.json();

    assert.equal(updateResponse.status, 200);
    assert.equal(updated.data.status, "reviewing");

    const persisted = await prisma.report.findUnique({
      where: { client_report_id: clientReportId },
    });
    assert.equal(persisted.status_type, "reviewing");
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
