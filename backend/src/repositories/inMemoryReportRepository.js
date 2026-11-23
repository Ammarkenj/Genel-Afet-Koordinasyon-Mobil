const { randomUUID } = require("node:crypto");
const { hashReportUpdateToken } = require("../security/reportUpdateToken");
const { toApiNeed } = require("./needMapping");

// #### TODO: Replace this temporary store with the PostgreSQL-backed repository.
function copyReport(report) {
  const { clientUpdateTokenHash, ...publicReport } = report;
  return {
    ...publicReport,
    location: { ...publicReport.location },
  };
}

class InMemoryReportRepository {
  constructor() {
    this.reports = new Map();
    this.reportIdsByClientId = new Map();
    this.needs = new Map();
  }

  create(input) {
    const existingId = this.reportIdsByClientId.get(input.clientReportId);

    if (existingId) {
      return {
        report: copyReport(this.reports.get(existingId)),
        created: false,
      };
    }

    const now = new Date().toISOString();
    const report = {
      id: randomUUID(),
      ...input,
      clientUpdateTokenHash: input.clientUpdateToken
        ? hashReportUpdateToken(input.clientUpdateToken)
        : null,
      status: "new",
      createdAt: now,
      updatedAt: now,
    };
    delete report.clientUpdateToken;

    this.reports.set(report.id, report);
    this.reportIdsByClientId.set(report.clientReportId, report.id);

    return { report: copyReport(report), created: true };
  }

  findById(id) {
    const report = this.reports.get(id);
    return report ? copyReport(report) : null;
  }

  listNeeds(reportId) {
    if (!this.reports.has(reportId)) return null;
    return [...this.needs.values()]
      .filter((need) => need.report_id === reportId)
      .sort((left, right) => left.need_id.localeCompare(right.need_id))
      .map(toApiNeed);
  }

  createNeed(reportId, input) {
    const report = this.reports.get(reportId);
    if (!report) return { status: "report_not_found" };
    if (report.kind !== "help") return { status: "report_not_eligible" };
    if (report.status === "resolved") return { status: "report_resolved" };

    const need = {
      need_id: randomUUID(),
      report_id: reportId,
      need_type: input.type,
      description: input.description,
      urgency_level: input.urgencyLevel,
      is_fulfilled: false,
      report: { event: null },
    };
    this.needs.set(need.need_id, need);
    return { status: "created", need: toApiNeed(need) };
  }

  fulfillNeed(reportId, needId) {
    const need = this.needs.get(needId);
    if (!need || need.report_id !== reportId) {
      return { status: "need_not_found" };
    }

    need.is_fulfilled = true;
    return { status: "fulfilled", need: toApiNeed(need) };
  }

  list(filters) {
    const matchingReports = [...this.reports.values()]
      .filter((report) => {
        if (filters.status && report.status !== filters.status) {
          return false;
        }

        if (filters.startDate && report.occurredAt < filters.startDate) {
          return false;
        }

        if (filters.endDate && report.occurredAt > filters.endDate) {
          return false;
        }

        if (filters.bounds) {
          const { latitude, longitude } = report.location;
          const { minLat, maxLat, minLon, maxLon } = filters.bounds;

          if (
            latitude < minLat ||
            latitude > maxLat ||
            longitude < minLon ||
            longitude > maxLon
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return {
      reports: matchingReports
        .slice(filters.offset, filters.offset + filters.limit)
        .map(copyReport),
      total: matchingReports.length,
    };
  }

  updateStatus(id, status) {
    const report = this.reports.get(id);

    if (!report) {
      return null;
    }

    report.status = status;
    report.updatedAt = new Date().toISOString();
    return copyReport(report);
  }

  updateGuestDetails(id, { clientUpdateToken, updates }) {
    const report = this.reports.get(id);
    if (
      !report ||
      !report.clientUpdateTokenHash ||
      report.clientUpdateTokenHash !== hashReportUpdateToken(clientUpdateToken)
    ) {
      return null;
    }

    Object.assign(report, updates);
    report.updatedAt = new Date().toISOString();
    return copyReport(report);
  }
}

module.exports = { InMemoryReportRepository };
