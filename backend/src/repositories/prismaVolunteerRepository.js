const { VolunteerApiError } = require("../services/volunteerService");

function urgencyToApi(value) {
  const normalized = String(value).trim().toLowerCase().replace(/[_-]+/g, " ");
  const level = new Map([
    ["1", 1],
    ["low", 1],
    ["normal", 1],
    ["low urgency", 1],
    ["2", 2],
    ["medium", 2],
    ["urgent", 2],
    ["high", 2],
    ["acil", 2],
    ["3", 3],
    ["critical", 3],
    ["very urgent", 3],
    ["very high", 3],
    ["çok acil", 3],
  ]).get(normalized);

  if (level == null) {
    throw new Error(`Unsupported need urgency level: ${value}`);
  }
  return level;
}

function toApiNeed(need) {
  return {
    id: need.need_id,
    type: need.need_type,
    description: need.description,
    urgency: urgencyToApi(need.urgency_level),
    eventTitle: need.report.event?.title ?? null,
    meters: null,
  };
}

function toApiTask(assignment) {
  if (!assignment?.need) return null;
  return {
    assignmentId: assignment.assignment_id,
    assignedAt: assignment.assigned_at.toISOString(),
    completedAt: assignment.completed_at?.toISOString() ?? null,
    need: toApiNeed(assignment.need),
  };
}

function toApiVolunteer(volunteer) {
  if (!volunteer) return null;
  return {
    role: volunteer.role_type,
    hasCertificate: volunteer.certification_status === "certified",
    available: volunteer.is_available,
  };
}

const needInclude = {
  report: {
    select: {
      event: { select: { title: true } },
    },
  },
};

class PrismaVolunteerRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async getDashboard(userId) {
    const volunteer = await this.prisma.volunteer.findUnique({
      where: { user_id: userId },
    });
    if (!volunteer) return { volunteer: null, needs: [], task: null };

    const [needs, assignment] = await Promise.all([
      this.prisma.need.findMany({
        where: {
          is_fulfilled: false,
          assignments: { none: {} },
        },
        include: needInclude,
        orderBy: { need_id: "asc" },
        take: 100,
      }),
      this.prisma.volunteerAssignment.findFirst({
        where: { volunteer_id: volunteer.volunteer_id, need_id: { not: null } },
        include: { need: { include: needInclude } },
        orderBy: [{ assigned_at: "desc" }, { assignment_id: "asc" }],
      }),
    ]);

    return {
      volunteer: toApiVolunteer(volunteer),
      needs: needs.map(toApiNeed),
      task: toApiTask(assignment),
    };
  }

  async register(userId, { role, hasCertificate }) {
    return this.prisma.volunteer.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        role_type: role,
        certification_status: hasCertificate ? "certified" : "none",
        is_available: true,
      },
      update: {
        role_type: role,
        certification_status: hasCertificate ? "certified" : "none",
      },
    });
  }

  async setAvailability(userId, available) {
    const result = await this.prisma.volunteer.updateMany({
      where: { user_id: userId },
      data: { is_available: available },
    });
    return result.count > 0;
  }

  async acceptNeed(userId, needId) {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const locked = await transaction.$queryRaw`
          SELECT "volunteer_id" FROM "Volunteer"
          WHERE "user_id" = ${userId}
          FOR UPDATE
        `;
        if (locked.length === 0) {
          throw new VolunteerApiError(
            404,
            "VOLUNTEER_NOT_REGISTERED",
            "Register as a volunteer before accepting a need.",
          );
        }

        const volunteer = await transaction.volunteer.findUnique({
          where: { user_id: userId },
        });
        if (!volunteer.is_available) {
          throw new VolunteerApiError(
            409,
            "VOLUNTEER_UNAVAILABLE",
            "Set your availability before accepting a need.",
          );
        }

        const activeAssignment =
          await transaction.volunteerAssignment.findFirst({
            where: {
              volunteer_id: volunteer.volunteer_id,
              need_id: { not: null },
              completed_at: null,
            },
            select: { assignment_id: true },
          });
        if (activeAssignment) {
          throw new VolunteerApiError(
            409,
            "ACTIVE_TASK_EXISTS",
            "Complete your active task before accepting another one.",
          );
        }

        const need = await transaction.need.findUnique({
          where: { need_id: needId },
          include: {
            report: { select: { event_id: true } },
          },
        });
        if (!need || need.is_fulfilled) {
          throw new VolunteerApiError(
            409,
            "NEED_UNAVAILABLE",
            "This need is no longer available.",
          );
        }

        return transaction.volunteerAssignment.create({
          data: {
            volunteer_id: volunteer.volunteer_id,
            event_id: need.report.event_id,
            need_id: need.need_id,
          },
        });
      });
    } catch (error) {
      if (error.code !== "P2002") throw error;

      const activeAssignment =
        await this.prisma.volunteerAssignment.findFirst({
          where: {
            volunteer: { user_id: userId },
            need_id: { not: null },
            completed_at: null,
          },
          select: { assignment_id: true },
        });
      if (activeAssignment) {
        throw new VolunteerApiError(
          409,
          "ACTIVE_TASK_EXISTS",
          "Complete your active task before accepting another one.",
        );
      }
      throw new VolunteerApiError(
        409,
        "NEED_UNAVAILABLE",
        "This need has already been accepted.",
      );
    }
  }

  async completeAssignment(userId, assignmentId) {
    return this.prisma.$transaction(async (transaction) => {
      const assignment = await transaction.volunteerAssignment.findFirst({
        where: {
          assignment_id: assignmentId,
          volunteer: { user_id: userId },
          need_id: { not: null },
          completed_at: null,
        },
        select: { assignment_id: true, need_id: true },
      });
      if (!assignment) return false;

      const completedAt = new Date();
      await transaction.volunteerAssignment.update({
        where: { assignment_id: assignment.assignment_id },
        data: { completed_at: completedAt },
      });
      await transaction.need.update({
        where: { need_id: assignment.need_id },
        data: { is_fulfilled: true },
      });
      return true;
    });
  }
}

module.exports = {
  PrismaVolunteerRepository,
  toApiNeed,
  toApiTask,
  toApiVolunteer,
  urgencyToApi,
};
