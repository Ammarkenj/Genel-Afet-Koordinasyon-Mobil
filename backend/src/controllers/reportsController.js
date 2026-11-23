const {
  validateCreateReport,
  validateGuestReportDetails,
  validateListFilters,
  validateStatusChange,
} = require("../validation/reportValidation");
const {
  validateCreateNeed,
  validateFulfillNeed,
} = require("../validation/needValidation");

function createReportsController(reportRepository) {
  return {
    async createReport(req, res) {
      const input = validateCreateReport(req.body);
      const result = await reportRepository.create(input);

      return res.status(result.created ? 201 : 200).json({
        data: result.report,
        duplicate: !result.created,
      });
    },

    async listReports(req, res) {
      const filters = validateListFilters(req.query);
      const result = await reportRepository.list(filters);

      return res.json({
        data: result.reports,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: result.total,
        },
      });
    },

    async updateReportStatus(req, res) {
      const report = await reportRepository.findById(req.params.id);

      if (!report) {
        return res.status(404).json({
          error: {
            code: "REPORT_NOT_FOUND",
            message: "The requested report was not found.",
          },
        });
      }

      const { status } = validateStatusChange(req.body, report.status);
      const updatedReport = await reportRepository.updateStatus(report.id, status);

      return res.json({ data: updatedReport });
    },

    async listReportNeeds(req, res) {
      const needs = await reportRepository.listNeeds(req.params.id);
      if (!needs) {
        return res.status(404).json({
          error: {
            code: "REPORT_NOT_FOUND",
            message: "The requested report was not found.",
          },
        });
      }
      return res.json({ data: needs });
    },

    async createReportNeed(req, res) {
      const input = validateCreateNeed(req.body);
      const result = await reportRepository.createNeed(req.params.id, input);
      if (result.status === "report_not_found") {
        return res.status(404).json({
          error: {
            code: "REPORT_NOT_FOUND",
            message: "The requested report was not found.",
          },
        });
      }
      if (result.status === "report_not_eligible") {
        return res.status(409).json({
          error: {
            code: "REPORT_NOT_ELIGIBLE_FOR_NEEDS",
            message: "Needs can only be created for help reports.",
          },
        });
      }
      if (result.status === "report_resolved") {
        return res.status(409).json({
          error: {
            code: "REPORT_RESOLVED",
            message: "Needs cannot be created for a resolved report.",
          },
        });
      }
      return res.status(201).json({ data: result.need });
    },

    async fulfillReportNeed(req, res) {
      validateFulfillNeed(req.body);
      const result = await reportRepository.fulfillNeed(
        req.params.id,
        req.params.needId,
      );
      if (result.status === "need_not_found") {
        return res.status(404).json({
          error: {
            code: "NEED_NOT_FOUND",
            message: "The requested need was not found for this report.",
          },
        });
      }
      if (result.status === "active_assignment") {
        return res.status(409).json({
          error: {
            code: "NEED_HAS_ACTIVE_ASSIGNMENT",
            message: "Complete or resolve the active volunteer assignment first.",
          },
        });
      }
      return res.json({ data: result.need });
    },

    async updateGuestReportDetails(req, res) {
      const input = validateGuestReportDetails(req.body);
      const report = await reportRepository.updateGuestDetails(req.params.id, input);

      if (!report) {
        return res.status(404).json({
          error: {
            code: "REPORT_NOT_FOUND",
            message: "The requested report was not found.",
          },
        });
      }

      return res.json({ data: report });
    },
  };
}

module.exports = { createReportsController };
