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

const SUPPORTED_PLATFORMS = new Set(["android", "ios", "web", "wearos"]);
const SUPPORTED_LANGUAGES = new Set(["tr", "ar", "en"]);

function validateDeviceRegistration(body) {
  requireObject(body, "Request body");

  const { token, platform, deviceId, language = "tr", cityCode } = body;

  if (typeof token !== "string" || token.trim().length < 8 || token.length > 512) {
    throw new ValidationError("token must be a valid push token between 8 and 512 characters.");
  }

  if (typeof platform !== "string" || !SUPPORTED_PLATFORMS.has(platform.toLowerCase())) {
    throw new ValidationError("platform must be one of: android, ios, web, wearos.");
  }

  if (language && (typeof language !== "string" || !SUPPORTED_LANGUAGES.has(language.toLowerCase()))) {
    throw new ValidationError("language must be one of: tr, ar, en.");
  }

  if (deviceId && (typeof deviceId !== "string" || deviceId.length > 128)) {
    throw new ValidationError("deviceId must be a string up to 128 characters.");
  }

  if (cityCode && (typeof cityCode !== "string" || cityCode.length > 16)) {
    throw new ValidationError("cityCode must be a string up to 16 characters.");
  }

  return {
    token: token.trim(),
    platform: platform.toLowerCase(),
    deviceId: deviceId ? deviceId.trim() : null,
    language: language ? language.toLowerCase() : "tr",
    cityCode: cityCode ? cityCode.trim() : null,
  };
}

module.exports = {
  ValidationError,
  validateDeviceRegistration,
};
