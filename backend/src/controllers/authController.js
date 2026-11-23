const {
  InvalidOtpError,
  OtpDeliveryUnavailableError,
  OtpRateLimitError,
} = require("../services/authService");
const {
  validateOtpRequest,
  validateOtpVerification,
} = require("../validation/authValidation");

function createAuthController(authService, authRepository) {
  return {
    async requestOtp(req, res) {
      const { phoneNumber } = validateOtpRequest(req.body);

      try {
        const challenge = await authService.requestOtp(phoneNumber);
        return res.status(202).json({ data: challenge });
      } catch (error) {
        if (error instanceof OtpDeliveryUnavailableError) {
          return res.status(503).json({
            error: {
              code: "OTP_DELIVERY_UNAVAILABLE",
              message: "Phone verification is not configured.",
            },
          });
        }
        if (error instanceof OtpRateLimitError) {
          return res.status(429).json({
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "Too many code requests. Try again later.",
            },
          });
        }
        throw error;
      }
    },

    async verifyOtp(req, res) {
      const input = validateOtpVerification(req.body);

      try {
        const session = await authService.verifyOtp(input);
        return res.json({ data: session });
      } catch (error) {
        if (error instanceof InvalidOtpError) {
          return res.status(401).json({
            error: {
              code: "OTP_INVALID_OR_EXPIRED",
              message: "The code is invalid or expired.",
            },
          });
        }
        if (error instanceof OtpDeliveryUnavailableError) {
          return res.status(503).json({
            error: {
              code: "OTP_DELIVERY_UNAVAILABLE",
              message: "Phone verification is not configured.",
            },
          });
        }
        throw error;
      }
    },

    async getCurrentUser(req, res) {
      return res.json({ data: req.authenticatedUser });
    },

    async logout(req, res) {
      await authRepository.revokeSession(req.authSessionTokenHash);
      return res.status(204).end();
    },
  };
}

module.exports = { createAuthController };
