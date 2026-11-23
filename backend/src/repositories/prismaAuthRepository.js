class PrismaAuthRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  countRecentOtpChallenges(phoneNumber, since) {
    return this.prisma.authOtpChallenge.count({
      where: { phone_number: phoneNumber, created_at: { gte: since } },
    });
  }

  async createOtpChallenge(input) {
    await this.prisma.authOtpChallenge.create({
      data: {
        challenge_id: input.challengeId,
        phone_number: input.phoneNumber,
        code_hash: input.codeHash,
        expires_at: input.expiresAt,
        created_at: input.createdAt,
      },
    });
  }

  async deleteOtpChallenge(challengeId) {
    await this.prisma.authOtpChallenge.deleteMany({
      where: { challenge_id: challengeId },
    });
  }

  async consumeOtherOtpChallenges(phoneNumber, exceptChallengeId, consumedAt) {
    await this.prisma.authOtpChallenge.updateMany({
      where: {
        phone_number: phoneNumber,
        challenge_id: { not: exceptChallengeId },
        consumed_at: null,
      },
      data: { consumed_at: consumedAt },
    });
  }

  findOtpChallenge(challengeId, phoneNumber) {
    return this.prisma.authOtpChallenge.findFirst({
      where: { challenge_id: challengeId, phone_number: phoneNumber },
    });
  }

  async recordOtpFailure(challengeId, now, maxAttempts) {
    const result = await this.prisma.authOtpChallenge.updateMany({
      where: {
        challenge_id: challengeId,
        consumed_at: null,
        expires_at: { gt: now },
        attempt_count: { lt: maxAttempts },
      },
      data: { attempt_count: { increment: 1 } },
    });

    if (result.count !== 1) return;

    await this.prisma.authOtpChallenge.updateMany({
      where: {
        challenge_id: challengeId,
        consumed_at: null,
        attempt_count: { gte: maxAttempts },
      },
      data: { consumed_at: now },
    });
  }

  consumeOtpAndCreateSession(input) {
    return this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.authOtpChallenge.updateMany({
        where: {
          challenge_id: input.challengeId,
          phone_number: input.phoneNumber,
          code_hash: input.codeHash,
          consumed_at: null,
          expires_at: { gt: input.now },
          attempt_count: { lt: 5 },
        },
        data: { consumed_at: input.now },
      });

      if (consumed.count !== 1) return null;

      const user = await transaction.user.upsert({
        where: { phone_number: input.phoneNumber },
        create: { phone_number: input.phoneNumber },
        update: {},
      });
      await transaction.authSession.create({
        data: {
          user_id: user.user_id,
          token_hash: input.tokenHash,
          expires_at: input.expiresAt,
        },
      });

      return { user };
    });
  }

  findSessionByTokenHash(tokenHash, now) {
    return this.prisma.authSession.findFirst({
      where: { token_hash: tokenHash, expires_at: { gt: now } },
      include: { user: true },
    });
  }

  async revokeSession(tokenHash) {
    await this.prisma.authSession.deleteMany({ where: { token_hash: tokenHash } });
  }
}

module.exports = { PrismaAuthRepository };
