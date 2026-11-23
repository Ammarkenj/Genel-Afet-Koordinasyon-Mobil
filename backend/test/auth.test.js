const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createApp } = require("../src/app");
const { InMemoryAuthRepository } = require("../src/repositories/inMemoryAuthRepository");
const { AuthService } = require("../src/services/authService");

const OTP_PEPPER = "test-only-otp-pepper-0123456789abcdef";

async function startTestServer(t, options) {
  const server = createApp(options).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));
  return `http://127.0.0.1:${server.address().port}`;
}

async function requestOtp(baseUrl, phoneNumber = "+90 532 111 22 33") {
  return fetch(`${baseUrl}/api/v1/auth/otp/request`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ phoneNumber }),
  });
}

test("phone OTP creates a session only after delivery and one-time verification", async (t) => {
  const repository = new InMemoryAuthRepository();
  let delivered;
  const baseUrl = await startTestServer(t, {
    authRepository: repository,
    otpPepper: OTP_PEPPER,
    smsSender: {
      async sendCode(message) {
        delivered = message;
      },
    },
  });

  const requestResponse = await requestOtp(baseUrl, "(532) 111-22-33");
  const requestBody = await requestResponse.json();

  assert.equal(requestResponse.status, 202);
  assert.match(delivered.phoneNumber, /^\+905\d{9}$/);
  assert.match(delivered.code, /^\d{6}$/);
  assert.equal("code" in requestBody.data, false);

  const verifyResponse = await fetch(`${baseUrl}/api/v1/auth/otp/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      challengeId: requestBody.data.challengeId,
      phoneNumber: "0532 111 22 33",
      code: delivered.code,
    }),
  });
  const verified = await verifyResponse.json();

  assert.equal(verifyResponse.status, 200);
  assert.match(verified.data.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(verified.data.user.phoneNumber, "+905321112233");
  assert.equal(verified.data.user.fullName, null);
  assert.equal("token_hash" in verified.data, false);

  const meResponse = await fetch(`${baseUrl}/api/v1/auth/me`, {
    headers: { authorization: `Bearer ${verified.data.token}` },
  });
  assert.equal(meResponse.status, 200);
  assert.equal((await meResponse.json()).data.id, verified.data.user.id);

  const replayResponse = await fetch(`${baseUrl}/api/v1/auth/otp/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      challengeId: requestBody.data.challengeId,
      phoneNumber: "0532 111 22 33",
      code: delivered.code,
    }),
  });
  assert.equal(replayResponse.status, 401);

  const logoutResponse = await fetch(`${baseUrl}/api/v1/auth/logout`, {
    method: "POST",
    headers: { authorization: `Bearer ${verified.data.token}` },
  });
  assert.equal(logoutResponse.status, 204);
  assert.equal(
    (await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { authorization: `Bearer ${verified.data.token}` },
    })).status,
    401,
  );
});

test("phone verification returns 503 without an SMS sender and stores no challenge", async (t) => {
  const repository = new InMemoryAuthRepository();
  const baseUrl = await startTestServer(t, {
    authRepository: repository,
    otpPepper: OTP_PEPPER,
  });

  const response = await requestOtp(baseUrl);
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.error.code, "OTP_DELIVERY_UNAVAILABLE");
  assert.equal(repository.challenges.size, 0);
});

test("a delivered code remains verifiable if outbound SMS is later unavailable", async () => {
  const repository = new InMemoryAuthRepository();
  let deliveredCode;
  const sender = {
    async sendCode({ code }) {
      deliveredCode = code;
    },
  };
  const requestingService = new AuthService({
    repository,
    smsSender: sender,
    otpPepper: OTP_PEPPER,
  });
  const challenge = await requestingService.requestOtp("+905321112233");
  const verifyingService = new AuthService({ repository, otpPepper: OTP_PEPPER });

  const session = await verifyingService.verifyOtp({
    challengeId: challenge.challengeId,
    phoneNumber: "+905321112233",
    code: deliveredCode,
  });

  assert.equal(session.user.phoneNumber, "+905321112233");
});

test("invalid OTP codes are limited and a correct code cannot be replayed after lockout", async (t) => {
  const repository = new InMemoryAuthRepository();
  let deliveredCode;
  const baseUrl = await startTestServer(t, {
    authRepository: repository,
    otpPepper: OTP_PEPPER,
    smsSender: {
      async sendCode({ code }) {
        deliveredCode = code;
      },
    },
  });
  const requestResponse = await requestOtp(baseUrl);
  const challenge = await requestResponse.json();

  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(`${baseUrl}/api/v1/auth/otp/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        challengeId: challenge.data.challengeId,
        phoneNumber: "+905321112233",
        code: deliveredCode === "000000" ? "000001" : "000000",
      }),
    });
    assert.equal(response.status, 401);
  }

  const lockedResponse = await fetch(`${baseUrl}/api/v1/auth/otp/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      challengeId: challenge.data.challengeId,
      phoneNumber: "+905321112233",
      code: deliveredCode,
    }),
  });

  assert.equal(lockedResponse.status, 401);
  assert.equal(repository.usersByPhone.size, 0);
  assert.equal(repository.sessionsByHash.size, 0);
});

test("OTP requests reject malformed phone numbers", async (t) => {
  const baseUrl = await startTestServer(t, {
    authRepository: new InMemoryAuthRepository(),
    otpPepper: OTP_PEPPER,
    smsSender: { async sendCode() {} },
  });

  const response = await requestOtp(baseUrl, "12345");
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "INVALID_REQUEST");
});
