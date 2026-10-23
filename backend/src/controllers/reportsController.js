const {
  validateCreateReport,
  validateListFilters,
  validateStatusChange,
} = require("../validation/reportValidation");

function createReportsController(reportRepository) {
  return {
    createReport(req, res) {
      const input = validateCreateReport(req.body);
      const result = reportRepository.create(input);

      return res.status(result.created ? 201 : 200).json({
        data: result.report,
        duplicate: !result.created,
      });
    },

    listReports(req, res) {
      const filters = validateListFilters(req.query);
      const result = reportRepository.list(filters);

      return res.json({
        data: result.reports,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: result.total,
        },
      });
    },

    updateReportStatus(req, res) {
      const report = reportRepository.findById(req.params.id);

      if (!report) {
        return res.status(404).json({
          error: {
            code: "REPORT_NOT_FOUND",
            message: "The requested report was not found.",
          },
        });
      }

      const { status } = validateStatusChange(req.body, report.status);
      const updatedReport = reportRepository.updateStatus(report.id, status);

      return res.json({ data: updatedReport });
    },
  };
}

module.exports = { createReportsController };
