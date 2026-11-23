const { randomUUID } = require("node:crypto");
const { VolunteerApiError } = require("../services/volunteerService");

class InMemoryVolunteerRepository {
  constructor({ needs = [] } = {}) {
    this.needs = new Map(needs.map((need) => [need.id, { ...need }]));
    this.volunteers = new Map();
    this.assignments = new Map();
  }

  async getDashboard(userId) {
    const volunteer = this.volunteers.get(userId);
    if (!volunteer) return { volunteer: null, needs: [], task: null };
    const assignment = [...this.assignments.values()]
      .filter((record) => record.userId === userId)
      .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt))[0];

    return {
      volunteer: {
        role: volunteer.role,
        hasCertificate: volunteer.hasCertificate,
        available: volunteer.available,
      },
      needs: [...this.needs.values()]
        .filter((need) => !need.fulfilled && !need.assignmentId)
        .map(({ id, type, description, urgency, eventTitle, meters }) => ({
          id,
          type,
          description,
          urgency,
          eventTitle: eventTitle ?? null,
          meters: meters ?? null,
        })),
      task: assignment
        ? {
            assignmentId: assignment.id,
            assignedAt: assignment.assignedAt,
            completedAt: assignment.completedAt,
            need: { ...this.needs.get(assignment.needId) },
          }
        : null,
    };
  }

  async register(userId, { role, hasCertificate }) {
    const existing = this.volunteers.get(userId);
    this.volunteers.set(userId, {
      role,
      hasCertificate,
      available: existing?.available ?? true,
    });
  }

  async setAvailability(userId, available) {
    const volunteer = this.volunteers.get(userId);
    if (!volunteer) return false;
    volunteer.available = available;
    return true;
  }

  async acceptNeed(userId, needId) {
    const volunteer = this.volunteers.get(userId);
    if (!volunteer) {
      throw new VolunteerApiError(
        404,
        "VOLUNTEER_NOT_REGISTERED",
        "Register as a volunteer before accepting a need.",
      );
    }
    if (!volunteer.available) {
      throw new VolunteerApiError(
        409,
        "VOLUNTEER_UNAVAILABLE",
        "Set your availability before accepting a need.",
      );
    }
    if (
      [...this.assignments.values()].some(
        (assignment) =>
          assignment.userId === userId && assignment.completedAt == null,
      )
    ) {
      throw new VolunteerApiError(
        409,
        "ACTIVE_TASK_EXISTS",
        "Complete your active task before accepting another one.",
      );
    }
    const need = this.needs.get(needId);
    if (!need || need.fulfilled || need.assignmentId) {
      throw new VolunteerApiError(
        409,
        "NEED_UNAVAILABLE",
        "This need is no longer available.",
      );
    }

    const id = randomUUID();
    const assignedAt = new Date().toISOString();
    this.assignments.set(id, {
      id,
      userId,
      needId,
      assignedAt,
      completedAt: null,
    });
    need.assignmentId = id;
  }

  async completeAssignment(userId, assignmentId) {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment || assignment.userId !== userId || assignment.completedAt) {
      return false;
    }
    assignment.completedAt = new Date().toISOString();
    this.needs.get(assignment.needId).fulfilled = true;
    return true;
  }
}

module.exports = { InMemoryVolunteerRepository };
