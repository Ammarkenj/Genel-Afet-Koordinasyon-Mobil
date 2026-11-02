const { ValidationError } = require("./deviceValidation");

function requireObject(value, fieldName) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be a JSON object.`);
  }
}

const ALERT_TYPES = new Set(["earthquake", "tsunami", "flood", "fire", "accident", "severe_weather", "general"]);
const ALERT_SEVERITIES = new Set(["critical", "warning", "info"]);

function validateBroadcastAlert(body) {
  requireObject(body, "Request body");

  const {
    type,
    severity = "critical",
    title,
    message,
    location,
    assemblyArea,
    expiresInHours = 24,
  } = body;

  if (typeof type !== "string" || !ALERT_TYPES.has(type.toLowerCase())) {
    throw new ValidationError(`type must be one of: ${[...ALERT_TYPES].join(", ")}.`);
  }

  if (typeof severity !== "string" || !ALERT_SEVERITIES.has(severity.toLowerCase())) {
    throw new ValidationError("severity must be one of: critical, warning, info.");
  }

  if (typeof title !== "string" || title.trim().length < 3 || title.length > 200) {
    throw new ValidationError("title must be a string between 3 and 200 characters.");
  }

  if (typeof message !== "string" || message.trim().length < 5 || message.length > 1000) {
    throw new ValidationError("message must be a string between 5 and 1000 characters.");
  }

  let validatedLocation = null;
  if (location) {
    requireObject(location, "location");
    const { latitude, longitude, radiusKm = 50, cityName } = location;

    if (typeof latitude !== "number" || latitude < -90 || latitude > 90) {
      throw new ValidationError("location.latitude must be a number between -90 and 90.");
    }
    if (typeof longitude !== "number" || longitude < -180 || longitude > 180) {
      throw new ValidationError("location.longitude must be a number between -180 and 180.");
    }

    validatedLocation = {
      latitude,
      longitude,
      radiusKm: typeof radiusKm === "number" && radiusKm > 0 ? radiusKm : 50,
      cityName: typeof cityName === "string" ? cityName.trim() : null,
    };
  }

  let validatedAssemblyArea = null;
  if (assemblyArea) {
    requireObject(assemblyArea, "assemblyArea");
    const { name, latitude, longitude } = assemblyArea;

    if (typeof name !== "string" || !name.trim()) {
      throw new ValidationError("assemblyArea.name must be a non-empty string.");
    }
    if (typeof latitude !== "number" || latitude < -90 || latitude > 90) {
      throw new ValidationError("assemblyArea.latitude must be a number between -90 and 90.");
    }
    if (typeof longitude !== "number" || longitude < -180 || longitude > 180) {
      throw new ValidationError("assemblyArea.longitude must be a number between -180 and 180.");
    }

    validatedAssemblyArea = {
      name: name.trim(),
      latitude,
      longitude,
    };
  }

  return {
    type: type.toLowerCase(),
    severity: severity.toLowerCase(),
    title: title.trim(),
    message: message.trim(),
    location: validatedLocation,
    assemblyArea: validatedAssemblyArea,
    expiresInHours: Number(expiresInHours) || 24,
  };
}

module.exports = {
  validateBroadcastAlert,
};
