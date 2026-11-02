const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createApp } = require("../src/app");
const { InMemoryDeviceRepository } = require("../src/repositories/inMemoryDeviceRepository");
const { InMemoryAlertRepository } = require("../src/repositories/inMemoryAlertRepository");
const { NotificationService, MockNotificationProvider } = require("../src/services/notificationService");

async function startTestServer(t, options = {}) {
  const server = createApp(options).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(
    () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  );

  return `http://127.0.0.1:${server.address().port}`;
}

test("device registration accepts token and is idempotent", async (t) => {
  const deviceRepository = new InMemoryDeviceRepository();
  const baseUrl = await startTestServer(t, { deviceRepository });

  const payload = {
    token: "fcm-device-token-12345678",
    platform: "android",
    deviceId: "phone-samsung-s23",
    language: "tr",
    cityCode: "Elazığ",
  };

  const firstResponse = await fetch(`${baseUrl}/api/v1/devices/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const firstJson = await firstResponse.json();

  assert.equal(firstResponse.status, 201);
  assert.equal(firstJson.created, true);
  assert.equal(firstJson.data.token, payload.token);

  // Duplicate registration
  const duplicateResponse = await fetch(`${baseUrl}/api/v1/devices/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const duplicateJson = await duplicateResponse.json();

  assert.equal(duplicateResponse.status, 200);
  assert.equal(duplicateJson.created, false);
  assert.equal(deviceRepository.count(), 1);

  // Unregister
  const unregisterResponse = await fetch(`${baseUrl}/api/v1/devices/${payload.token}`, {
    method: "DELETE",
  });
  const unregisterJson = await unregisterResponse.json();
  assert.equal(unregisterJson.success, true);
  assert.equal(deviceRepository.count(), 0);
});

test("alert broadcast triggers notification dispatch and records active alert", async (t) => {
  const deviceRepository = new InMemoryDeviceRepository();
  deviceRepository.register({
    token: "target-device-token-001",
    platform: "android",
    cityCode: "Elazığ",
  });

  const mockProvider = new MockNotificationProvider();
  const notificationService = new NotificationService({
    deviceRepository,
    provider: mockProvider,
  });
  const alertRepository = new InMemoryAlertRepository();

  const baseUrl = await startTestServer(t, {
    deviceRepository,
    alertRepository,
    notificationService,
  });

  const alertPayload = {
    type: "earthquake",
    severity: "critical",
    title: "Deprem Uyarısı (Elazığ)",
    message: "Şiddetli sarsıntı kaydedildi. Güvenli toplanma alanına geçiniz.",
    location: {
      latitude: 38.68,
      longitude: 39.22,
      radiusKm: 40,
      cityName: "Elazığ",
    },
    assemblyArea: {
      name: "Kültür Park Toplanma Alanı",
      latitude: 38.675,
      longitude: 39.215,
    },
  };

  const broadcastResponse = await fetch(`${baseUrl}/api/v1/alerts/broadcast`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(alertPayload),
  });
  const broadcastJson = await broadcastResponse.json();

  assert.equal(broadcastResponse.status, 201);
  assert.equal(broadcastJson.data.type, "earthquake");
  assert.equal(broadcastJson.data.status, "active");
  assert.equal(broadcastJson.dispatch.dispatchedCount, 1);
  assert.equal(mockProvider.getHistory().length, 1);

  const sentPush = mockProvider.getHistory()[0];
  assert.deepEqual(sentPush.tokens, ["target-device-token-001"]);
  assert.match(sentPush.payload.notification.title, /Deprem Uyarısı/);

  // Query active alerts
  const activeResponse = await fetch(`${baseUrl}/api/v1/alerts/active`);
  const activeJson = await activeResponse.json();
  assert.equal(activeResponse.status, 200);
  assert.equal(activeJson.count, 1);
  assert.equal(activeJson.data[0].id, broadcastJson.data.id);

  // Resolve alert
  const resolveResponse = await fetch(`${baseUrl}/api/v1/alerts/${broadcastJson.data.id}/resolve`, {
    method: "PATCH",
  });
  const resolveJson = await resolveResponse.json();
  assert.equal(resolveResponse.status, 200);
  assert.equal(resolveJson.data.status, "resolved");

  // Verify no longer active
  const activeAfterResolve = await fetch(`${baseUrl}/api/v1/alerts/active`);
  assert.equal((await activeAfterResolve.json()).count, 0);
});

test("alert broadcast validates input and rejects invalid locations", async (t) => {
  const baseUrl = await startTestServer(t);

  const invalidResponse = await fetch(`${baseUrl}/api/v1/alerts/broadcast`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      type: "invalid_disaster_type",
      title: "Test",
      message: "Test message",
    }),
  });

  assert.equal(invalidResponse.status, 400);
  const errorJson = await invalidResponse.json();
  assert.equal(errorJson.error.code, "INVALID_REQUEST");
});
