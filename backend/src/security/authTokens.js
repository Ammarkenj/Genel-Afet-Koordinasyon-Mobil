const { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } = require("node:crypto");

function hashOtpCode(challengeId, code, pepper) {
  return createHmac("sha256", pepper)
    .update(`${challengeId}:${code}`)
    .digest("hex");
}

function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function generateOtpCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function generateSessionToken() {
  return randomBytes(32).toString("base64url");
}

function hashesEqual(left, right) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

module.exports = {
  generateOtpCode,
  generateSessionToken,
  hashOtpCode,
  hashSessionToken,
  hashesEqual,
};
