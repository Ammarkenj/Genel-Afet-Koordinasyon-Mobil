const express = require("express");
const { createAlertsController } = require("../controllers/alertsController");
const { InMemoryAlertRepository } = require("../repositories/inMemoryAlertRepository");

function alertRoutes({
  alertRepository = new InMemoryAlertRepository(),
  notificationService = null,
} = {}) {
  const router = express.Router();
  const controller = createAlertsController(alertRepository, notificationService);

  router.post("/broadcast", controller.broadcastAlert);
  router.get("/active", controller.listActiveAlerts);
  router.get("/:id", controller.getAlertById);
  router.patch("/:id/resolve", controller.resolveAlert);

  return router;
}

module.exports = alertRoutes;
