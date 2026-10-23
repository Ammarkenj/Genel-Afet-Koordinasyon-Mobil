const { randomUUID } = require("node:crypto");

// #### TODO: Replace this temporary store with the PostgreSQL-backed repository.
function copyReport(report) {
  return {
    ...report,
    location: { ...report.location },
  };
}

class InMemoryReportRepository {
  constructor() {
    this.reports = new Map();
    this.reportIdsByClientId = new Map();
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
      status: "new",
      createdAt: now,
      updatedAt: now,
    };

    this.reports.set(report.id, report);
    this.reportIdsByClientId.set(report.clientReportId, report.id);

    return { report: copyReport(report), created: true };
  }

  findById(id) {
    const report = this.reports.get(id);
    return report ? copyReport(report) : null;
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
}

module.exports = { InMemoryReportRepository };
