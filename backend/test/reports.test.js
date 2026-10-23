const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createApp } = require("../src/app");

async function startTestServer(t) {
  const server = createApp().listen(0, "127.0.0.1");
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

test("reports can be filtered, paginated, and moved through allowed statuses", async (t) => {
  const baseUrl = await startTestServer(t);
  const createResponse = await fetch(`${baseUrl}/api/v1/reports`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(reportPayload()),
  });
  const created = (await createResponse.json()).data;

  const filterResponse = await fetch(
    `${baseUrl}/api/v1/reports?status=new&minLat=38&maxLat=39&minLon=39&maxLon=40&limit=1`,
  );
  const filtered = await filterResponse.json();

  assert.equal(filterResponse.status, 200);
  assert.equal(filtered.pagination.total, 1);
  assert.equal(filtered.data[0].id, created.id);

  const updateResponse = await fetch(`${baseUrl}/api/v1/reports/${created.id}/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "reviewing" }),
  });
  assert.equal(updateResponse.status, 200);
  assert.equal((await updateResponse.json()).data.status, "reviewing");

  const invalidTransitionResponse = await fetch(
    `${baseUrl}/api/v1/reports/${created.id}/status`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "new" }),
    },
  );
  assert.equal(invalidTransitionResponse.status, 400);
});

test("unknown routes return a structured 404 response", async (t) => {
  const baseUrl = await startTestServer(t);
  const response = await fetch(`${baseUrl}/api/v1/missing`);

  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, "NOT_FOUND");
});
