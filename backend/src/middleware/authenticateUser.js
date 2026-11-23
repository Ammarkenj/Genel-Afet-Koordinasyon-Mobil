const { hashSessionToken } = require("../security/authTokens");
const { toApiUser } = require("../services/authService");

function unauthorized(res) {
  return res.status(401).json({
    error: {
      code: "AUTHENTICATION_REQUIRED",
      message: "A valid bearer token is required.",
    },
  });
}

function createAuthenticateUser(authRepository) {
  return async (req, res, next) => {
    const match = /^Bearer ([A-Za-z0-9_-]{43})$/i.exec(
      req.get("authorization") ?? "",
    );
    if (!match) return unauthorized(res);

    const tokenHash = hashSessionToken(match[1]);
    const session = await authRepository.findSessionByTokenHash(
      tokenHash,
      new Date(),
    );
    if (!session) return unauthorized(res);

    req.authenticatedUser = toApiUser(session.user ?? session);
    req.authSessionTokenHash = tokenHash;
    return next();
  };
}

module.exports = { createAuthenticateUser };
