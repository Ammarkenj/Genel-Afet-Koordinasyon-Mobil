const { validateBroadcastAlert } = require("../validation/alertValidation");

function createAlertsController(alertRepository, notificationService) {
  return {
    async broadcastAlert(req, res) {
      const input = validateBroadcastAlert(req.body);
      const alert = await alertRepository.create(input);

      let dispatchResult = null;
      if (notificationService) {
        dispatchResult = await notificationService.dispatchAlert(alert);
      }

      return res.status(201).json({
        data: alert,
        dispatch: dispatchResult,
      });
    },

    async listActiveAlerts(req, res) {
      const alerts = await alertRepository.listActive();
      return res.json({
        data: alerts,
        count: alerts.length,
      });
    },

    async getAlertById(req, res) {
      const alert = await alertRepository.findById(req.params.id);

      if (!alert) {
        return res.status(404).json({
          error: {
            code: "ALERT_NOT_FOUND",
            message: "The requested emergency alert was not found.",
          },
        });
      }

      return res.json({ data: alert });
    },

    async resolveAlert(req, res) {
      const alert = await alertRepository.resolve(req.params.id);

      if (!alert) {
        return res.status(404).json({
          error: {
            code: "ALERT_NOT_FOUND",
            message: "The requested emergency alert was not found.",
          },
        });
      }

      return res.json({
        data: alert,
        message: "Alert resolved successfully. All-clear issued.",
      });
    },
  };
}

module.exports = { createAlertsController };
