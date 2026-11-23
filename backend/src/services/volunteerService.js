const crypto = require("node:crypto");

const VOLUNTEER_ROLES = new Set(["aid", "rescue", "logistics"]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class VolunteerApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "VolunteerApiError";
    this.status = status;
    this.code = code;
  }
}

class VolunteerService {
  constructor(repository) {
    this.repository = repository;
  }

  getDashboard(userId) {
    return this.repository.getDashboard(userId);
  }

  async register(userId, input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new VolunteerApiError(
        400,
        "INVALID_REQUEST",
        "Request body must be an object.",
      );
    }
    if (!VOLUNTEER_ROLES.has(input.role)) {
      throw new VolunteerApiError(
        400,
        "INVALID_ROLE",
        "role must be aid, rescue, or logistics.",
      );
    }
    if (typeof input.hasCertificate !== "boolean") {
      throw new VolunteerApiError(
        400,
        "INVALID_CERTIFICATION_STATUS",
        "hasCertificate must be a boolean.",
      );
    }

    await this.repository.register(userId, input);
    return this.getDashboard(userId);
  }

  async setAvailability(userId, input) {
    if (!input || typeof input.available !== "boolean") {
      throw new VolunteerApiError(
        400,
        "INVALID_AVAILABILITY",
        "available must be a boolean.",
      );
    }
    const updated = await this.repository.setAvailability(
      userId,
      input.available,
    );
    if (!updated) {
      throw new VolunteerApiError(
        404,
        "VOLUNTEER_NOT_REGISTERED",
        "Register as a volunteer before changing availability.",
      );
    }
    return this.getDashboard(userId);
  }

  async acceptNeed(userId, input) {
    if (!input || typeof input.needId !== "string" || !UUID_PATTERN.test(input.needId)) {
      throw new VolunteerApiError(
        400,
        "INVALID_NEED_ID",
        "needId must be a valid identifier.",
      );
    }
    await this.repository.acceptNeed(userId, input.needId);
    return this.getDashboard(userId);
  }

  async completeAssignment(userId, assignmentId) {
    if (typeof assignmentId !== "string" || !UUID_PATTERN.test(assignmentId)) {
      throw new VolunteerApiError(
        400,
        "INVALID_ASSIGNMENT_ID",
        "assignmentId must be a valid identifier.",
      );
    }
    const completed = await this.repository.completeAssignment(
      userId,
      assignmentId,
    );
    if (!completed) {
      throw new VolunteerApiError(
        404,
        "ACTIVE_ASSIGNMENT_NOT_FOUND",
        "The active assignment was not found.",
      );
    }
    return this.getDashboard(userId);
  }
}

module.exports = {
  VolunteerApiError,
  VolunteerService,
};
