const { createHash } = require("node:crypto");

function hashReportUpdateToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

module.exports = { hashReportUpdateToken };
