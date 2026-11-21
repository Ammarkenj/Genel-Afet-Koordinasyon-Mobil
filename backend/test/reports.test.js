const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createApp } = require("../src/app");

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

test("unknown routes return a structured 404 response", async (t) => {
  const baseUrl = await startTestServer(t);
  const response = await fetch(`${baseUrl}/api/v1/missing`);

  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, "NOT_FOUND");
});
