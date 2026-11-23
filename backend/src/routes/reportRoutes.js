const express = require("express");
const { createReportsController } = require("../controllers/reportsController");
const { InMemoryReportRepository } = require("../repositories/inMemoryReportRepository");
const { createStaffAuthMiddleware } = require("../middleware/staffAuth");
const { rateLimit } = require("express-rate-limit");

function reportRoutes({
  reportRepository = new InMemoryReportRepository(),
  staffApiToken,
} = {}) {
  const router = express.Router();
  const controller = createReportsController(reportRepository);
  const requireStaffAuth = createStaffAuthMiddleware(staffApiToken);
  const limitReportSubmissions = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many reports from this IP. Try again later.",
        },
      }),
  });
  const limitReportDetails = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many report updates from this IP. Try again later.",
        },
      }),
  });

  router.post("/", limitReportSubmissions, controller.createReport);
  router.get("/", requireStaffAuth, controller.listReports);
  router.patch("/:id/status", requireStaffAuth, controller.updateReportStatus);
  router.get("/:id/needs", requireStaffAuth, controller.listReportNeeds);
  router.post("/:id/needs", requireStaffAuth, controller.createReportNeed);
  router.patch(
    "/:id/needs/:needId",
    requireStaffAuth,
    controller.fulfillReportNeed,
  );
  router.patch(
    "/:id/details",
    limitReportDetails,
    controller.updateGuestReportDetails,
  );

  return router;
}

module.exports = reportRoutes;
