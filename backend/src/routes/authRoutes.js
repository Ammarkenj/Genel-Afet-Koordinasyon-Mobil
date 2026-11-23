const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { createAuthController } = require("../controllers/authController");
const { createAuthenticateUser } = require("../middleware/authenticateUser");
const { InMemoryAuthRepository } = require("../repositories/inMemoryAuthRepository");
const { AuthService } = require("../services/authService");

function authRoutes({
  authRepository = new InMemoryAuthRepository(),
  authService,
  smsSender,
  otpPepper,
} = {}) {
  const router = express.Router();
  const service =
    authService ??
    new AuthService({ repository: authRepository, smsSender, otpPepper });
  const controller = createAuthController(service, authRepository);
  const requireUser = createAuthenticateUser(authRepository);
  const limitOtpRequests = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many code requests. Try again later.",
        },
      }),
  });
  const limitOtpVerifications = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many code attempts. Try again later.",
        },
      }),
  });

  router.post("/otp/request", limitOtpRequests, controller.requestOtp);
  router.post("/otp/verify", limitOtpVerifications, controller.verifyOtp);
  router.get("/me", requireUser, controller.getCurrentUser);
  router.post("/logout", requireUser, controller.logout);

  return router;
}

module.exports = authRoutes;
