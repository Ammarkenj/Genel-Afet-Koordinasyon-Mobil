const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { test } = require("node:test");
const { createApp } = require("../src/app");
const { hashSessionToken } = require("../src/security/authTokens");
const { InMemoryAuthRepository } = require("../src/repositories/inMemoryAuthRepository");
const { InMemoryVolunteerRepository } = require("../src/repositories/inMemoryVolunteerRepository");

async function startTestServer(t, options) {
  const server = createApp(options).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));
  return `http://127.0.0.1:${server.address().port}`;
}

test("authenticated volunteer signup, task acceptance, and completion persist", async (t) => {
  const authRepository = new InMemoryAuthRepository();
  const token = "A".repeat(43);
  const user = {
    user_id: randomUUID(),
    phone_number: "+905321112233",
    full_name: null,
  };
  const tokenHash = hashSessionToken(token);
  authRepository.sessionsByHash.set(tokenHash, {
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 60_000),
    user,
  });
  const needId = randomUUID();
  const secondNeedId = randomUUID();
  const volunteerRepository = new InMemoryVolunteerRepository({
    needs: [
      {
        id: needId,
        type: "water",
        description: "Deliver drinking water.",
        urgency: 2,
      },
      {
        id: secondNeedId,
        type: "aid",
        description: "First aid support.",
        urgency: 3,
      },
    ],
  });
  const baseUrl = await startTestServer(t, {
    authRepository,
    volunteerRepository,
  });
  const headers = {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };

  const unauthorized = await fetch(`${baseUrl}/api/v1/volunteers/me`);
  assert.equal(unauthorized.status, 401);

  const initial = await fetch(`${baseUrl}/api/v1/volunteers/me`, { headers });
  assert.deepEqual(await initial.json(), {
    data: { volunteer: null, needs: [], task: null },
  });

  const registered = await fetch(`${baseUrl}/api/v1/volunteers/me`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ role: "rescue", hasCertificate: true }),
  });
  const registeredData = (await registered.json()).data;
  assert.equal(registered.status, 200);
  assert.deepEqual(registeredData.volunteer, {
    role: "rescue",
    hasCertificate: true,
    available: true,
  });
  assert.equal(registeredData.needs.length, 2);

  const accepted = await fetch(
    `${baseUrl}/api/v1/volunteers/me/assignments`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ needId }),
    },
  );
  const acceptedData = (await accepted.json()).data;
  assert.equal(accepted.status, 201);
  assert.equal(acceptedData.task.need.id, needId);
  assert.equal(acceptedData.needs.length, 1);

  const secondAcceptance = await fetch(
    `${baseUrl}/api/v1/volunteers/me/assignments`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ needId: secondNeedId }),
    },
  );
  assert.equal(secondAcceptance.status, 409);
  assert.equal(
    (await secondAcceptance.json()).error.code,
    "ACTIVE_TASK_EXISTS",
  );

  const completed = await fetch(
    `${baseUrl}/api/v1/volunteers/me/assignments/${acceptedData.task.assignmentId}/complete`,
    { method: "PATCH", headers },
  );
  const completedData = (await completed.json()).data;
  assert.equal(completed.status, 200);
  assert.notEqual(completedData.task.completedAt, null);
  assert.equal(completedData.needs.length, 1);
});

test("unavailable volunteers cannot accept database needs", async (t) => {
  const authRepository = new InMemoryAuthRepository();
  const token = "B".repeat(43);
  const user = {
    user_id: randomUUID(),
    phone_number: "+905321112234",
    full_name: null,
  };
  const tokenHash = hashSessionToken(token);
  authRepository.sessionsByHash.set(tokenHash, {
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 60_000),
    user,
  });
  const needId = randomUUID();
  const baseUrl = await startTestServer(t, {
    authRepository,
    volunteerRepository: new InMemoryVolunteerRepository({
      needs: [{ id: needId, type: "shelter", urgency: 1 }],
    }),
  });
  const headers = {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };

  await fetch(`${baseUrl}/api/v1/volunteers/me`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ role: "logistics", hasCertificate: false }),
  });
  const unavailable = await fetch(
    `${baseUrl}/api/v1/volunteers/me/availability`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ available: false }),
    },
  );
  assert.equal(unavailable.status, 200);

  const accepted = await fetch(
    `${baseUrl}/api/v1/volunteers/me/assignments`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ needId }),
    },
  );
  assert.equal(accepted.status, 409);
  assert.equal(
    (await accepted.json()).error.code,
    "VOLUNTEER_UNAVAILABLE",
  );
});
