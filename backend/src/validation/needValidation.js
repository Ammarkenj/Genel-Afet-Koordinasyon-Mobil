const NEED_TYPES = new Set(["aid", "water", "shelter", "other"]);
const URGENCY_LEVELS = new Map([
  [1, "normal"],
  [2, "urgent"],
  [3, "very urgent"],
]);

class NeedValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "NeedValidationError";
    this.status = 400;
  }
}

function requireObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new NeedValidationError("Request body must be a JSON object.");
  }
}

function validateCreateNeed(body) {
  requireObject(body);
  const { type, description, urgency } = body;

  if (typeof type !== "string" || !NEED_TYPES.has(type)) {
    throw new NeedValidationError(
      `type must be one of: ${[...NEED_TYPES].join(", ")}.`,
    );
  }
  if (!Number.isInteger(urgency) || !URGENCY_LEVELS.has(urgency)) {
    throw new NeedValidationError("urgency must be an integer from 1 to 3.");
  }
  if (
    description !== undefined &&
    description !== null &&
    (typeof description !== "string" || description.length > 1000)
  ) {
    throw new NeedValidationError(
      "description must be a string up to 1000 characters.",
    );
  }

  return {
    type,
    description: typeof description === "string" ? description.trim() || null : null,
    urgencyLevel: URGENCY_LEVELS.get(urgency),
  };
}

function validateFulfillNeed(body) {
  requireObject(body);
  if (body.fulfilled !== true) {
    throw new NeedValidationError("fulfilled must be true.");
  }
  return { fulfilled: true };
}

module.exports = {
  NeedValidationError,
  validateCreateNeed,
  validateFulfillNeed,
};
