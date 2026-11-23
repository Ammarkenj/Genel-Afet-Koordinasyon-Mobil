const { randomUUID } = require("node:crypto");

class InMemoryAuthRepository {
  constructor() {
    this.challenges = new Map();
    this.usersByPhone = new Map();
    this.sessionsByHash = new Map();
  }

  async countRecentOtpChallenges(phoneNumber, since) {
    return [...this.challenges.values()].filter(
      (challenge) =>
        challenge.phone_number === phoneNumber &&
        challenge.created_at >= since,
    ).length;
  }

  async createOtpChallenge(input) {
    this.challenges.set(input.challengeId, {
      challenge_id: input.challengeId,
      phone_number: input.phoneNumber,
      code_hash: input.codeHash,
      expires_at: input.expiresAt,
      attempt_count: 0,
      consumed_at: null,
      created_at: input.createdAt,
    });
  }

  async deleteOtpChallenge(challengeId) {
    this.challenges.delete(challengeId);
  }

  async consumeOtherOtpChallenges(phoneNumber, exceptChallengeId, consumedAt) {
    for (const challenge of this.challenges.values()) {
      if (
        challenge.phone_number === phoneNumber &&
        challenge.challenge_id !== exceptChallengeId &&
        !challenge.consumed_at
      ) {
        challenge.consumed_at = consumedAt;
      }
    }
  }

  async findOtpChallenge(challengeId, phoneNumber) {
    const challenge = this.challenges.get(challengeId);
    return challenge?.phone_number === phoneNumber ? { ...challenge } : null;
  }

  async recordOtpFailure(challengeId, now, maxAttempts) {
    const challenge = this.challenges.get(challengeId);
    if (!challenge || challenge.consumed_at || challenge.expires_at <= now) return;

    challenge.attempt_count++;
    if (challenge.attempt_count >= maxAttempts) challenge.consumed_at = now;
  }

  async consumeOtpAndCreateSession(input) {
    const challenge = this.challenges.get(input.challengeId);
    if (
      !challenge ||
      challenge.phone_number !== input.phoneNumber ||
      challenge.code_hash !== input.codeHash ||
      challenge.consumed_at ||
      challenge.expires_at <= input.now ||
      challenge.attempt_count >= 5
    ) {
      return null;
    }

    challenge.consumed_at = input.now;
    let user = this.usersByPhone.get(input.phoneNumber);
    if (!user) {
      user = {
        user_id: randomUUID(),
        phone_number: input.phoneNumber,
        full_name: null,
      };
      this.usersByPhone.set(input.phoneNumber, user);
    }

    const session = {
      token_hash: input.tokenHash,
      expires_at: input.expiresAt,
      user,
    };
    this.sessionsByHash.set(input.tokenHash, session);
    return session;
  }

  async findSessionByTokenHash(tokenHash, now) {
    const session = this.sessionsByHash.get(tokenHash);
    return session && session.expires_at > now ? session : null;
  }

  async revokeSession(tokenHash) {
    this.sessionsByHash.delete(tokenHash);
  }
}

module.exports = { InMemoryAuthRepository };
