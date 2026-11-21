const REPORT_TYPES = new Set(["accident", "fall", "fire", "earthquake", "help"]);
const REPORT_KINDS = new Set(["help", "safe"]);
const REPORT_STATUSES = new Set(["new", "reviewing", "assigned", "resolved"]);
const STATUS_TRANSITIONS = {
  new: new Set(["reviewing"]),
  reviewing: new Set(["assigned", "resolved"]),
  assigned: new Set(["reviewing", "resolved"]),
  resolved: new Set(),
};
const LIST_QUERY_KEYS = new Set([
  "status",
  "startDate",
  "endDate",
  "minLat",
  "maxLat",
  "minLon",
  "maxLon",
  "limit",
  "offset",
]);

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
  }
}

function requireObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be a JSON object.`);
  }
}

function validateTimestamp(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`${fieldName} must be an ISO 8601 timestamp.`);
  }

  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    throw new ValidationError(`${fieldName} must be a valid ISO 8601 timestamp.`);
  }

  return new Date(timestamp).toISOString();
}

function validateCreateReport(body) {
  requireObject(body, "Request body");

  const {
    clientReportId,
    kind = "help",
    type,
    occurredAt,
    location,
    description,
    auto = false,
    injured = null,
    trapped = null,
    people = 1,
    clientUpdateToken,
  } = body;

  if (
    typeof clientReportId !== "string" ||
    clientReportId.trim().length < 1 ||
    clientReportId.length > 128
  ) {
    throw new ValidationError("clientReportId must be a non-empty string up to 128 characters.");
  }

  if (typeof kind !== "string" || !REPORT_KINDS.has(kind)) {
    throw new ValidationError(`kind must be one of: ${[...REPORT_KINDS].join(", ")}.`);
  }

  if (kind === "help" && (typeof type !== "string" || !REPORT_TYPES.has(type))) {
    throw new ValidationError(`type must be one of: ${[...REPORT_TYPES].join(", ")}.`);
  }

  if (kind === "safe" && type != null) {
    throw new ValidationError("type must be omitted or null for a safe report.");
  }

  if (typeof auto !== "boolean") {
    throw new ValidationError("auto must be a boolean.");
  }

  for (const [field, value] of [["injured", injured], ["trapped", trapped]]) {
    if (value !== null && typeof value !== "boolean") {
      throw new ValidationError(`${field} must be a boolean or null.`);
    }
  }

  if (!Number.isInteger(people) || people < 1 || people > 99) {
    throw new ValidationError("people must be an integer between 1 and 99.");
  }

  if (
    clientUpdateToken !== undefined &&
    (typeof clientUpdateToken !== "string" ||
      !/^[a-f\d]{64}$/i.test(clientUpdateToken))
  ) {
    throw new ValidationError("clientUpdateToken must be a 64-character hexadecimal token.");
  }

  requireObject(location, "location");

  const { latitude, longitude } = location;

  if (typeof latitude !== "number" || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new ValidationError("location.latitude must be a number between -90 and 90.");
  }

  if (
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new ValidationError("location.longitude must be a number between -180 and 180.");
  }

  if (description !== undefined && (typeof description !== "string" || description.length > 1000)) {
    throw new ValidationError("description must be a string up to 1000 characters.");
  }

  return {
    clientReportId: clientReportId.trim(),
    kind,
    type: kind === "safe" ? null : type,
    occurredAt: validateTimestamp(occurredAt, "occurredAt"),
    location: { latitude, longitude },
    auto,
    injured,
    trapped,
    people,
    ...(clientUpdateToken === undefined ? {} : { clientUpdateToken }),
    ...(description === undefined ? {} : { description: description.trim() }),
  };
}

function validateGuestReportDetails(body) {
  requireObject(body, "Request body");

  const { clientUpdateToken } = body;
  if (
    typeof clientUpdateToken !== "string" ||
    !/^[a-f\d]{64}$/i.test(clientUpdateToken)
  ) {
    throw new ValidationError("clientUpdateToken must be a 64-character hexadecimal token.");
  }

  const updates = {};
  for (const field of ["injured", "trapped"]) {
    if (Object.hasOwn(body, field)) {
      const value = body[field];
      if (value !== null && typeof value !== "boolean") {
        throw new ValidationError(`${field} must be a boolean or null.`);
      }
      updates[field] = value;
    }
  }

  if (Object.hasOwn(body, "people")) {
    const { people } = body;
    if (!Number.isInteger(people) || people < 1 || people > 99) {
      throw new ValidationError("people must be an integer between 1 and 99.");
    }
    updates.people = people;
  }

  if (Object.keys(updates).length === 0) {
    throw new ValidationError("At least one report detail must be provided.");
  }

  return { clientUpdateToken, updates };
}

function parseQueryNumber(value, fieldName, { integer = false } = {}) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`${fieldName} must be a number.`);
  }

  const number = Number(value);

  if (!Number.isFinite(number) || (integer && !Number.isInteger(number))) {
    throw new ValidationError(`${fieldName} must be a valid ${integer ? "integer" : "number"}.`);
  }

  return number;
}

function validateListFilters(query) {
  for (const key of Object.keys(query)) {
    if (!LIST_QUERY_KEYS.has(key)) {
      throw new ValidationError(`Unsupported query parameter: ${key}.`);
    }
  }

  let status;

  if (query.status !== undefined) {
    if (typeof query.status !== "string" || !REPORT_STATUSES.has(query.status)) {
      throw new ValidationError(`status must be one of: ${[...REPORT_STATUSES].join(", ")}.`);
    }
    status = query.status;
  }

  const startDate =
    query.startDate === undefined ? undefined : validateTimestamp(query.startDate, "startDate");
  const endDate =
    query.endDate === undefined ? undefined : validateTimestamp(query.endDate, "endDate");

  if (startDate && endDate && startDate > endDate) {
    throw new ValidationError("startDate must be earlier than or equal to endDate.");
  }

  const boundKeys = ["minLat", "maxLat", "minLon", "maxLon"];
  const providedBounds = boundKeys.filter((key) => query[key] !== undefined);
  let bounds;

  if (providedBounds.length > 0 && providedBounds.length !== boundKeys.length) {
    throw new ValidationError("Provide all four location bounds: minLat, maxLat, minLon, maxLon.");
  }

  if (providedBounds.length === boundKeys.length) {
    bounds = {
      minLat: parseQueryNumber(query.minLat, "minLat"),
      maxLat: parseQueryNumber(query.maxLat, "maxLat"),
      minLon: parseQueryNumber(query.minLon, "minLon"),
      maxLon: parseQueryNumber(query.maxLon, "maxLon"),
    };

    if (
      bounds.minLat < -90 ||
      bounds.maxLat > 90 ||
      bounds.minLon < -180 ||
      bounds.maxLon > 180 ||
      bounds.minLat > bounds.maxLat ||
      bounds.minLon > bounds.maxLon
    ) {
      throw new ValidationError("Location bounds must be ordered and within valid coordinate ranges.");
    }
  }

  const limit =
    query.limit === undefined ? 20 : parseQueryNumber(query.limit, "limit", { integer: true });
  const offset =
    query.offset === undefined ? 0 : parseQueryNumber(query.offset, "offset", { integer: true });

  if (limit < 1 || limit > 100) {
    throw new ValidationError("limit must be an integer between 1 and 100.");
  }

  if (offset < 0) {
    throw new ValidationError("offset must be a non-negative integer.");
  }

  return { status, startDate, endDate, bounds, limit, offset };
}

function validateStatusChange(body, currentStatus) {
  requireObject(body, "Request body");

  const { status } = body;

  if (typeof status !== "string" || !REPORT_STATUSES.has(status)) {
    throw new ValidationError(`status must be one of: ${[...REPORT_STATUSES].join(", ")}.`);
  }

  if (!STATUS_TRANSITIONS[currentStatus].has(status)) {
    throw new ValidationError(`Status cannot transition from ${currentStatus} to ${status}.`);
  }

  return { status };
}

module.exports = {
  validateCreateReport,
  validateGuestReportDetails,
  validateListFilters,
  validateStatusChange,
};
