class AuthValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthValidationError";
    this.status = 400;
  }
}

function normalizeTurkishPhoneNumber(value) {
  if (typeof value !== "string") {
    throw new AuthValidationError("phoneNumber must be a Turkish mobile number.");
  }

  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0090")) digits = digits.slice(4);
  else if (digits.startsWith("90") && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);

  if (!/^5\d{9}$/.test(digits)) {
    throw new AuthValidationError("phoneNumber must be a Turkish mobile number.");
  }

  return `+90${digits}`;
}

function requireObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AuthValidationError("Request body must be a JSON object.");
  }
}

function validateOtpRequest(body) {
  requireObject(body);
  return { phoneNumber: normalizeTurkishPhoneNumber(body.phoneNumber) };
}

function validateOtpVerification(body) {
  requireObject(body);

  if (
    typeof body.challengeId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      body.challengeId,
    )
  ) {
    throw new AuthValidationError("challengeId must be a valid challenge identifier.");
  }

  if (typeof body.code !== "string" || !/^\d{6}$/.test(body.code)) {
    throw new AuthValidationError("code must contain exactly six digits.");
  }

  return {
    challengeId: body.challengeId,
    phoneNumber: normalizeTurkishPhoneNumber(body.phoneNumber),
    code: body.code,
  };
}

module.exports = {
  AuthValidationError,
  normalizeTurkishPhoneNumber,
  validateOtpRequest,
  validateOtpVerification,
};
