require("dotenv").config({ path: require("node:path").resolve(__dirname, "..", ".env") });

const assert = require("node:assert/strict");
const { randomInt, randomUUID } = require("node:crypto");
const { test } = require("node:test");
const { PrismaClient } = require("@prisma/client");
const { createApp } = require("../src/app");
const { PrismaAuthRepository } = require("../src/repositories/prismaAuthRepository");
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

test(
  "PostgreSQL persists verified users and revocable OTP sessions",
  { skip: process.env.RUN_DATABASE_TESTS !== "1" },
  async (t) => {
    assert.ok(
      process.env.DATABASE_URL,
      "DATABASE_URL must be set in backend/.env or the environment.",
    );

    const prisma = new PrismaClient();
    const phoneNumber = `+905${randomInt(0, 1_000_000_000).toString().padStart(9, "0")}`;
    const otpPepper = "database-test-otp-pepper-0123456789abcdef";
    let deliveredCode;
    let server;

    try {
      await prisma.$connect();
      server = createApp({
        authRepository: new PrismaAuthRepository(prisma),
        otpPepper,
        smsSender: {
          async sendCode(message) {
            deliveredCode = message.code;
          },
        },
      }).listen(0, "127.0.0.1");
      await new Promise((resolve) => server.once("listening", resolve));
      const baseUrl = `http://127.0.0.1:${server.address().port}`;

      const requestResponse = await fetch(`${baseUrl}/api/v1/auth/otp/request`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const request = await requestResponse.json();
      assert.equal(requestResponse.status, 202);

      const verifyResponse = await fetch(`${baseUrl}/api/v1/auth/otp/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          challengeId: request.data.challengeId,
          phoneNumber,
          code: deliveredCode,
        }),
      });
      const verified = await verifyResponse.json();
      assert.equal(verifyResponse.status, 200);
      assert.equal(verified.data.user.phoneNumber, phoneNumber);

      const storedUser = await prisma.user.findUnique({
        where: { phone_number: phoneNumber },
      });
      const storedChallenge = await prisma.authOtpChallenge.findUnique({
        where: { challenge_id: request.data.challengeId },
      });
      const storedSession = await prisma.authSession.findFirst({
        where: { user_id: storedUser.user_id },
      });
      assert.equal(storedUser.full_name, null);
      assert.notEqual(storedChallenge.code_hash, deliveredCode);
      assert.notEqual(storedSession.token_hash, verified.data.token);

      const meResponse = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { authorization: `Bearer ${verified.data.token}` },
      });
      assert.equal(meResponse.status, 200);

      const logoutResponse = await fetch(`${baseUrl}/api/v1/auth/logout`, {
        method: "POST",
        headers: { authorization: `Bearer ${verified.data.token}` },
      });
      assert.equal(logoutResponse.status, 204);
      assert.equal(
        await prisma.authSession.count({ where: { user_id: storedUser.user_id } }),
        0,
      );
    } finally {
      if (server) {
        await new Promise((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        });
      }

      await prisma.authOtpChallenge.deleteMany({ where: { phone_number: phoneNumber } });
      await prisma.user.deleteMany({ where: { phone_number: phoneNumber } });
      await prisma.$disconnect();
    }
  },
);
