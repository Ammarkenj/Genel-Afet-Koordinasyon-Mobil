const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createApp } = require("../src/app");
const { InMemoryReportRepository } = require("../src/repositories/inMemoryReportRepository");
const { PrismaReportRepository } = require("../src/repositories/prismaReportRepository");

async function startTestServer(t, options) {
  const server = createApp(options).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));

  return `http://127.0.0.1:${server.address().port}`;
}

function reportPayload(overrides = {}) {
  return {
    clientReportId: "device-report-1",
    type: "accident",
    occurredAt: "2026-10-23T14:30:00.000Z",
    location: { latitude: 38.68, longitude: 39.22 },
    description: "Road accident",
    ...overrides,
  };
}

test("health endpoint reports that the database is not configured", async (t) => {
  const baseUrl = await startTestServer(t);
  const response = await fetch(`${baseUrl}/api/v1/health`);

  assert.equal(response.status, 200);
  assert.equal((await response.json()).database, "not_configured");
});

test("report submission validates input and is idempotent", async (t) => {
  const baseUrl = await startTestServer(t);
  const firstResponse = await fetch(`${baseUrl}/api/v1/reports`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(reportPayload()),
  });
  const firstResult = await firstResponse.json();

  assert.equal(firstResponse.status, 201);
  assert.equal(firstResult.data.status, "new");
  assert.equal(firstResult.duplicate, false);

  const duplicateResponse = await fetch(`${baseUrl}/api/v1/reports`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(reportPayload()),
  });
  const duplicateResult = await duplicateResponse.json();

  assert.equal(duplicateResponse.status, 200);
  assert.equal(duplicateResult.data.id, firstResult.data.id);
  assert.equal(duplicateResult.duplicate, true);

  const invalidResponse = await fetch(`${baseUrl}/api/v1/reports`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(reportPayload({ location: { latitude: 91, longitude: 0 } })),
  });

  assert.equal(invalidResponse.status, 400);
  assert.equal((await invalidResponse.json()).error.code, "INVALID_REQUEST");
});

test("safe reports persist and follow-up details require the report token", async (t) => {
  const baseUrl = await startTestServer(t);
  const clientUpdateToken = "a".repeat(64);
  const createResponse = await fetch(`${baseUrl}/api/v1/reports`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(
      reportPayload({
        kind: "safe",
        type: null,
        clientUpdateToken,
      }),
    ),
  });
  const created = await createResponse.json();

  assert.equal(createResponse.status, 201);
  assert.equal(created.data.kind, "safe");
  assert.equal(created.data.type, null);
  assert.equal("clientUpdateTokenHash" in created.data, false);

  const unauthorizedUpdate = await fetch(
    `${baseUrl}/api/v1/reports/${created.data.id}/details`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        clientUpdateToken: "b".repeat(64),
        injured: true,
      }),
    },
  );
  assert.equal(unauthorizedUpdate.status, 404);

  const updateResponse = await fetch(
    `${baseUrl}/api/v1/reports/${created.data.id}/details`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        clientUpdateToken,
        injured: true,
        trapped: false,
        people: 2,
      }),
    },
  );
  const updated = await updateResponse.json();

  assert.equal(updateResponse.status, 200);
  assert.equal(updated.data.injured, true);
  assert.equal(updated.data.trapped, false);
  assert.equal(updated.data.people, 2);
  assert.equal("clientUpdateTokenHash" in updated.data, false);
});

test("report submission allows ten requests per IP and rejects the eleventh", async (t) => {
  const baseUrl = await startTestServer(t);

  for (let requestNumber = 1; requestNumber <= 10; requestNumber++) {
    const response = await fetch(`${baseUrl}/api/v1/reports`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        reportPayload({ clientReportId: `rate-limit-report-${requestNumber}` }),
      ),
    });

    assert.equal(response.status, 201, `request ${requestNumber} should be accepted`);
  }

  const limitedResponse = await fetch(`${baseUrl}/api/v1/reports`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(reportPayload({ clientReportId: "rate-limit-report-11" })),
  });

  assert.equal(limitedResponse.status, 429);
  assert.equal(
    (await limitedResponse.json()).error.code,
    "RATE_LIMIT_EXCEEDED",
  );
});

test("staff report endpoints stay disabled when the staff token is not configured", async (t) => {
  const baseUrl = await startTestServer(t);
  const listResponse = await fetch(`${baseUrl}/api/v1/reports`);
  const updateResponse = await fetch(`${baseUrl}/api/v1/reports/unknown/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "reviewing" }),
  });

  assert.equal(listResponse.status, 503);
  assert.equal((await listResponse.json()).error.code, "STAFF_AUTH_NOT_CONFIGURED");
  assert.equal(updateResponse.status, 503);
  assert.equal((await updateResponse.json()).error.code, "STAFF_AUTH_NOT_CONFIGURED");
});

test("staff report endpoints require a valid bearer token and allow listing and status updates", async (t) => {
  const staffApiToken = "test-staff-token";
  const baseUrl = await startTestServer(t, { staffApiToken });
  const createResponse = await fetch(`${baseUrl}/api/v1/reports`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(reportPayload()),
  });
  const createdReport = await createResponse.json();

  const missingTokenResponse = await fetch(`${baseUrl}/api/v1/reports`);
  assert.equal(missingTokenResponse.status, 401);

  const invalidTokenResponse = await fetch(`${baseUrl}/api/v1/reports`, {
    headers: { authorization: "Bearer wrong-token" },
  });
  assert.equal(invalidTokenResponse.status, 401);

  const listResponse = await fetch(`${baseUrl}/api/v1/reports?status=new&limit=5`, {
    headers: { authorization: `Bearer ${staffApiToken}` },
  });
  const listResult = await listResponse.json();

  assert.equal(listResponse.status, 200);
  assert.equal(listResult.data.length, 1);
  assert.equal(listResult.data[0].id, createdReport.data.id);
  assert.deepEqual(listResult.pagination, { limit: 5, offset: 0, total: 1 });

  const updateResponse = await fetch(
    `${baseUrl}/api/v1/reports/${createdReport.data.id}/status`,
    {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${staffApiToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ status: "reviewing" }),
    },
  );
  const updatedReport = await updateResponse.json();

  assert.equal(updateResponse.status, 200);
  assert.equal(updatedReport.data.status, "reviewing");
});

test("staff can create and fulfill needs linked to help reports", async (t) => {
  const staffApiToken = "test-staff-token";
  const reportRepository = new InMemoryReportRepository();
  const baseUrl = await startTestServer(t, { reportRepository, staffApiToken });
  const createReportResponse = await fetch(`${baseUrl}/api/v1/reports`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(
      reportPayload({ clientReportId: "need-linked-report" }),
    ),
  });
  const report = (await createReportResponse.json()).data;
  const staffHeaders = {
    authorization: `Bearer ${staffApiToken}`,
    "content-type": "application/json",
  };
  const needsPath = `${baseUrl}/api/v1/reports/${report.id}/needs`;

  const unauthorized = await fetch(needsPath);
  assert.equal(unauthorized.status, 401);

  const unauthorizedCreate = await fetch(needsPath, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "water", urgency: 2 }),
  });
  assert.equal(unauthorizedCreate.status, 401);

  const missingReportNeeds = await fetch(
    `${baseUrl}/api/v1/reports/missing-report/needs`,
    { headers: { authorization: `Bearer ${staffApiToken}` } },
  );
  assert.equal(missingReportNeeds.status, 404);

  const initialNeeds = await fetch(needsPath, {
    headers: { authorization: `Bearer ${staffApiToken}` },
  });
  assert.deepEqual(await initialNeeds.json(), { data: [] });

  const invalidNeed = await fetch(needsPath, {
    method: "POST",
    headers: staffHeaders,
    body: JSON.stringify({ type: "unknown", urgency: 2 }),
  });
  assert.equal(invalidNeed.status, 400);

  const createNeed = await fetch(needsPath, {
    method: "POST",
    headers: staffHeaders,
    body: JSON.stringify({
      type: "water",
      description: "Deliver drinking water.",
      urgency: 2,
    }),
  });
  const need = (await createNeed.json()).data;
  assert.equal(createNeed.status, 201);
  assert.equal(need.reportId, report.id);
  assert.equal(need.type, "water");
  assert.equal(need.urgency, 2);
  assert.equal(need.fulfilled, false);

  const unauthorizedFulfillment = await fetch(`${needsPath}/${need.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fulfilled: true }),
  });
  assert.equal(unauthorizedFulfillment.status, 401);

  const invalidFulfillment = await fetch(`${needsPath}/${need.id}`, {
    method: "PATCH",
    headers: staffHeaders,
    body: JSON.stringify({ fulfilled: false }),
  });
  assert.equal(invalidFulfillment.status, 400);

  const fulfilledResponse = await fetch(`${needsPath}/${need.id}`, {
    method: "PATCH",
    headers: staffHeaders,
    body: JSON.stringify({ fulfilled: true }),
  });
  assert.equal(fulfilledResponse.status, 200);
  assert.equal((await fulfilledResponse.json()).data.fulfilled, true);

  const listedNeeds = await fetch(needsPath, {
    headers: { authorization: `Bearer ${staffApiToken}` },
  });
  assert.equal((await listedNeeds.json()).data[0].fulfilled, true);
});

test("staff cannot create needs for safe or resolved reports", async (t) => {
  const staffApiToken = "test-staff-token";
  const reportRepository = new InMemoryReportRepository();
  const baseUrl = await startTestServer(t, { reportRepository, staffApiToken });
  const headers = {
    authorization: `Bearer ${staffApiToken}`,
    "content-type": "application/json",
  };
  const safeResponse = await fetch(`${baseUrl}/api/v1/reports`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(
      reportPayload({
        clientReportId: "safe-report",
        kind: "safe",
        type: null,
      }),
    ),
  });
  const safeReport = (await safeResponse.json()).data;

  const safeNeedResponse = await fetch(
    `${baseUrl}/api/v1/reports/${safeReport.id}/needs`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ type: "aid", urgency: 1 }),
    },
  );
  assert.equal(safeNeedResponse.status, 409);

  const helpResponse = await fetch(`${baseUrl}/api/v1/reports`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(
      reportPayload({ clientReportId: "resolved-help-report" }),
    ),
  });
  const helpReport = (await helpResponse.json()).data;
  await fetch(`${baseUrl}/api/v1/reports/${helpReport.id}/status`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status: "reviewing" }),
  });
  await fetch(`${baseUrl}/api/v1/reports/${helpReport.id}/status`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status: "resolved" }),
  });

  const resolvedNeedResponse = await fetch(
    `${baseUrl}/api/v1/reports/${helpReport.id}/needs`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ type: "aid", urgency: 1 }),
    },
  );
  assert.equal(resolvedNeedResponse.status, 409);
});

test("Prisma refuses to fulfill a need with an active volunteer assignment", async () => {
  let updateCalled = false;
  const transaction = {
    async $queryRaw() {
      return [{ need_id: "need-1" }];
    },
    need: {
      async findUnique() {
        return {
          need_id: "need-1",
          report_id: "report-1",
          need_type: "water",
          description: null,
          urgency_level: "urgent",
          is_fulfilled: false,
          report: { event: null },
        };
      },
      async update() {
        updateCalled = true;
      },
    },
    volunteerAssignment: {
      async findFirst() {
        return { assignment_id: "assignment-1" };
      },
    },
  };
  const repository = new PrismaReportRepository({
    async $transaction(callback) {
      return callback(transaction);
    },
  });

  const result = await repository.fulfillNeed("report-1", "need-1");

  assert.deepEqual(result, { status: "active_assignment" });
  assert.equal(updateCalled, false);
});

test("unknown routes return a structured 404 response", async (t) => {
  const baseUrl = await startTestServer(t);
  const response = await fetch(`${baseUrl}/api/v1/missing`);

  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, "NOT_FOUND");
});
