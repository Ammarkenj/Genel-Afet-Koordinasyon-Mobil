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

test("CORS preflight allows only explicitly configured web origins", async (t) => {
  const baseUrl = await startTestServer(t, {
    webAllowedOrigins: "http://localhost:5000",
  });
  const allowed = await fetch(`${baseUrl}/api/v1/auth/otp/request`, {
    method: "OPTIONS",
    headers: {
      origin: "http://localhost:5000",
      "access-control-request-method": "POST",
      "access-control-request-headers": "content-type",
    },
  });

  assert.equal(allowed.status, 204);
  assert.equal(
    allowed.headers.get("access-control-allow-origin"),
    "http://localhost:5000",
  );
  assert.equal(
    allowed.headers.get("access-control-allow-methods"),
    "GET, POST, PATCH, OPTIONS",
  );

  const denied = await fetch(`${baseUrl}/api/v1/auth/otp/request`, {
    method: "OPTIONS",
    headers: {
      origin: "http://untrusted.example",
      "access-control-request-method": "POST",
    },
  });
  assert.equal(denied.status, 403);
  assert.equal((await denied.json()).error.code, "ORIGIN_NOT_ALLOWED");
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
});

test("requests without a browser Origin header remain available to mobile clients", async (t) => {
  const baseUrl = await startTestServer(t);
  const response = await fetch(`${baseUrl}/api/v1/health`);

  assert.equal(response.status, 200);
});
