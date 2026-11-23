const { randomUUID } = require("node:crypto");
const {
  generateOtpCode,
  generateSessionToken,
  hashOtpCode,
  hashSessionToken,
  hashesEqual,
} = require("../security/authTokens");

const OTP_LIFETIME_MS = 5 * 60 * 1000;
const OTP_REQUEST_WINDOW_MS = 15 * 60 * 1000;
const OTP_REQUEST_LIMIT = 3;
const OTP_MAX_ATTEMPTS = 5;
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const MIN_OTP_PEPPER_LENGTH = 32;

class OtpDeliveryUnavailableError extends Error {
  constructor() {
    super("One-time code delivery is not configured.");
    this.name = "OtpDeliveryUnavailableError";
  }
}

class OtpRateLimitError extends Error {
  constructor() {
    super("Too many code requests. Try again later.");
    this.name = "OtpRateLimitError";
  }
}

class InvalidOtpError extends Error {
  constructor() {
    super("The code is invalid or expired.");
    this.name = "InvalidOtpError";
  }
}

function toApiUser(user) {
  return {
    id: user.user_id,
    phoneNumber: user.phone_number,
    fullName: user.full_name,
  };
}

class AuthService {
  constructor({ repository, smsSender, otpPepper, clock = () => new Date() }) {
    this.repository = repository;
    this.smsSender = smsSender;
    this.otpPepper = otpPepper;
    this.clock = clock;
  }

  ensureOtpPepperConfigured() {
    if (typeof this.otpPepper !== "string" || this.otpPepper.length < MIN_OTP_PEPPER_LENGTH) {
      throw new OtpDeliveryUnavailableError();
    }
  }

  ensureOtpDeliveryConfigured() {
    this.ensureOtpPepperConfigured();
    if (!this.smsSender || typeof this.smsSender.sendCode !== "function") {
      throw new OtpDeliveryUnavailableError();
    }
  }

  async requestOtp(phoneNumber) {
    this.ensureOtpDeliveryConfigured();

    const now = this.clock();
    const recentCount = await this.repository.countRecentOtpChallenges(
      phoneNumber,
      new Date(now.getTime() - OTP_REQUEST_WINDOW_MS),
    );
    if (recentCount >= OTP_REQUEST_LIMIT) throw new OtpRateLimitError();

    const challengeId = randomUUID();
    const code = generateOtpCode();
    const expiresAt = new Date(now.getTime() + OTP_LIFETIME_MS);

    await this.repository.createOtpChallenge({
      challengeId,
      phoneNumber,
      codeHash: hashOtpCode(challengeId, code, this.otpPepper),
      expiresAt,
      createdAt: now,
    });

    try {
      await this.smsSender.sendCode({ phoneNumber, code });
    } catch (error) {
      await this.repository.deleteOtpChallenge(challengeId);
      throw new OtpDeliveryUnavailableError();
    }

    await this.repository.consumeOtherOtpChallenges(phoneNumber, challengeId, now);
    return { challengeId, expiresAt: expiresAt.toISOString() };
  }

  async verifyOtp({ challengeId, phoneNumber, code }) {
    this.ensureOtpPepperConfigured();
    const now = this.clock();
    const challenge = await this.repository.findOtpChallenge(challengeId, phoneNumber);

    if (
      !challenge ||
      challenge.consumed_at ||
      challenge.expires_at <= now ||
      challenge.attempt_count >= OTP_MAX_ATTEMPTS
    ) {
      throw new InvalidOtpError();
    }

    const candidateHash = hashOtpCode(challengeId, code, this.otpPepper);
    if (!hashesEqual(candidateHash, challenge.code_hash)) {
      await this.repository.recordOtpFailure(challengeId, now, OTP_MAX_ATTEMPTS);
      throw new InvalidOtpError();
    }

    const token = generateSessionToken();
    const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS);
    const session = await this.repository.consumeOtpAndCreateSession({
      challengeId,
      phoneNumber,
      codeHash: candidateHash,
      now,
      tokenHash: hashSessionToken(token),
      expiresAt,
    });

    if (!session) throw new InvalidOtpError();

    return {
      token,
      expiresAt: expiresAt.toISOString(),
      user: toApiUser(session.user),
    };
  }

}

module.exports = {
  AuthService,
  InvalidOtpError,
  OtpDeliveryUnavailableError,
  OtpRateLimitError,
  toApiUser,
};
