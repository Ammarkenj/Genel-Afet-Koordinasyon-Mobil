const { hashReportUpdateToken } = require("../security/reportUpdateToken");

function toApiReport(report) {
  return {
    id: report.report_id,
    clientReportId: report.client_report_id,
    kind: report.kind,
    type: report.type,
    auto: report.auto,
    occurredAt: report.occurred_at.toISOString(),
    location: {
      latitude: report.latitude,
      longitude: report.longitude,
    },
    ...(report.description === null ? {} : { description: report.description }),
    injured: report.injured,
    trapped: report.trapped,
    people: report.people,
    status: report.status_type,
    createdAt: report.created_at.toISOString(),
    updatedAt: report.updated_at.toISOString(),
  };
}

class PrismaReportRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async create(input) {
    const existing = await this.prisma.report.findUnique({
      where: { client_report_id: input.clientReportId },
    });

    if (existing) {
      return { report: toApiReport(existing), created: false };
    }

    try {
      const report = await this.prisma.report.create({
        data: {
          client_report_id: input.clientReportId,
          kind: input.kind,
          status_type: "new",
          type: input.type,
          auto: input.auto,
          occurred_at: new Date(input.occurredAt),
          latitude: input.location.latitude,
          longitude: input.location.longitude,
          description: input.description ?? null,
          injured: input.injured,
          trapped: input.trapped,
          people: input.people,
          client_update_token_hash: input.clientUpdateToken
            ? hashReportUpdateToken(input.clientUpdateToken)
            : null,
        },
      });

      return { report: toApiReport(report), created: true };
    } catch (error) {
      if (error.code !== "P2002") {
        throw error;
      }

      const duplicate = await this.prisma.report.findUnique({
        where: { client_report_id: input.clientReportId },
      });

      if (!duplicate) {
        throw error;
      }

      return { report: toApiReport(duplicate), created: false };
    }
  }

  async findById(id) {
    const report = await this.prisma.report.findUnique({
      where: { report_id: id },
    });

    return report ? toApiReport(report) : null;
  }

  async list(filters) {
    const where = {
      ...(filters.status ? { status_type: filters.status } : {}),
      ...(filters.startDate || filters.endDate
        ? {
            occurred_at: {
              ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
              ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
            },
          }
        : {}),
      ...(filters.bounds
        ? {
            latitude: {
              gte: filters.bounds.minLat,
              lte: filters.bounds.maxLat,
            },
            longitude: {
              gte: filters.bounds.minLon,
              lte: filters.bounds.maxLon,
            },
          }
        : {}),
    };

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: [{ created_at: "desc" }, { report_id: "asc" }],
        skip: filters.offset,
        take: filters.limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      reports: reports.map(toApiReport),
      total,
    };
  }

  async updateStatus(id, status) {
    const report = await this.prisma.report.update({
      where: { report_id: id },
      data: { status_type: status },
    });

    return toApiReport(report);
  }

  async updateGuestDetails(id, { clientUpdateToken, updates }) {
    const report = await this.prisma.report.findFirst({
      where: {
        report_id: id,
        client_update_token_hash: hashReportUpdateToken(clientUpdateToken),
      },
      select: { report_id: true },
    });

    if (!report) return null;

    const updatedReport = await this.prisma.report.update({
      where: { report_id: id },
      data: updates,
    });

    return toApiReport(updatedReport);
  }
}

module.exports = { PrismaReportRepository };
