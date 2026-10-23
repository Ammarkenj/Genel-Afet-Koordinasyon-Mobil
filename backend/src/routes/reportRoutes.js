const express = require("express");
const { createReportsController } = require("../controllers/reportsController");
const { InMemoryReportRepository } = require("../repositories/inMemoryReportRepository");

function reportRoutes({ reportRepository = new InMemoryReportRepository() } = {}) {
  const router = express.Router();
  const controller = createReportsController(reportRepository);

  router.post("/", controller.createReport);
  router.get("/", controller.listReports);
  router.patch("/:id/status", controller.updateReportStatus);

  return router;
}

module.exports = reportRoutes;
