const { createHash, timingSafeEqual } = require("node:crypto");

function createStaffAuthMiddleware(expectedToken) {
  return function requireStaffAuth(req, res, next) {
    if (typeof expectedToken !== "string" || expectedToken.length === 0) {
      return res.status(503).json({
        error: {
          code: "STAFF_AUTH_NOT_CONFIGURED",
          message: "Staff access is not configured.",
        },
      });
    }

    const match = /^Bearer\s+(\S+)$/i.exec(req.get("authorization") || "");

    if (!match || !tokensMatch(match[1], expectedToken)) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "A valid staff bearer token is required.",
        },
      });
    }

    return next();
  };
}

function tokensMatch(candidate, expected) {
  const candidateHash = createHash("sha256").update(candidate).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(candidateHash, expectedHash);
}

module.exports = { createStaffAuthMiddleware };
