const { hashReportUpdateToken } = require("../security/reportUpdateToken");
const { toApiNeed } = require("./needMapping");

const needInclude = {
  report: {
    select: {
      event: { select: { title: true } },
    },
  },
};

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

  async listNeeds(reportId) {
    const report = await this.prisma.report.findUnique({
      where: { report_id: reportId },
      select: { report_id: true },
    });
    if (!report) return null;

    const needs = await this.prisma.need.findMany({
      where: { report_id: reportId },
      include: needInclude,
      orderBy: { need_id: "asc" },
    });
    return needs.map(toApiNeed);
  }

  async createNeed(reportId, input) {
    return this.prisma.$transaction(async (transaction) => {
      const reports = await transaction.$queryRaw`
        SELECT "report_id", "kind", "status_type"
        FROM "Report"
        WHERE "report_id" = ${reportId}
        FOR UPDATE
      `;
      if (reports.length === 0) return { status: "report_not_found" };
      if (reports[0].kind !== "help") {
        return { status: "report_not_eligible" };
      }
      if (reports[0].status_type === "resolved") {
        return { status: "report_resolved" };
      }

      const need = await transaction.need.create({
        data: {
          report_id: reportId,
          need_type: input.type,
          description: input.description,
          urgency_level: input.urgencyLevel,
        },
        include: needInclude,
      });
      return { status: "created", need: toApiNeed(need) };
    });
  }

  async fulfillNeed(reportId, needId) {
    return this.prisma.$transaction(async (transaction) => {
      const lockedNeeds = await transaction.$queryRaw`
        SELECT "need_id" FROM "Need"
        WHERE "need_id" = ${needId} AND "report_id" = ${reportId}
        FOR UPDATE
      `;
      if (lockedNeeds.length === 0) return { status: "need_not_found" };

      const need = await transaction.need.findUnique({
        where: { need_id: needId },
        include: needInclude,
      });
      if (need.is_fulfilled) {
        return { status: "fulfilled", need: toApiNeed(need) };
      }

      const activeAssignment =
        await transaction.volunteerAssignment.findFirst({
          where: { need_id: needId, completed_at: null },
          select: { assignment_id: true },
        });
      if (activeAssignment) return { status: "active_assignment" };

      const fulfilledNeed = await transaction.need.update({
        where: { need_id: needId },
        data: { is_fulfilled: true },
        include: needInclude,
      });
      return { status: "fulfilled", need: toApiNeed(fulfilledNeed) };
    });
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
