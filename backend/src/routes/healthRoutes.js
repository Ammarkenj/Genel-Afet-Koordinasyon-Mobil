const express = require("express");

function healthRoutes({ databaseClient } = {}) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    if (!databaseClient) {
      return res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "not_configured",
      });
    }

    try {
      await databaseClient.$queryRaw`SELECT 1`;
      return res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected",
      });
    } catch (error) {
      console.error("Database health check failed:", {
        name: error.name,
        code: error.code,
      });
      return res.status(503).json({
        status: "degraded",
        timestamp: new Date().toISOString(),
        database: "unavailable",
      });
    }
  });

  return router;
}

module.exports = healthRoutes;
