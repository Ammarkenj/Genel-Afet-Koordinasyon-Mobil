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
    reportId: need.report_id,
    type: need.need_type,
    description: need.description,
    urgency: urgencyToApi(need.urgency_level),
    fulfilled: need.is_fulfilled,
    eventTitle: need.report?.event?.title ?? null,
    meters: null,
  };
}

module.exports = { toApiNeed, urgencyToApi };
