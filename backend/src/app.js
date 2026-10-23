const express = require("express");
const healthRoutes = require("./routes/healthRoutes");
const reportRoutes = require("./routes/reportRoutes");

function createApp({ reportRepository } = {}) {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));
  app.use("/api/v1/health", healthRoutes);
  app.use("/api/v1/reports", reportRoutes({ reportRepository }));

  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "The requested endpoint was not found.",
      },
    });
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
      return res.status(400).json({
        error: {
          code: "INVALID_JSON",
          message: "Request body must contain valid JSON.",
        },
      });
    }

    if (error.type === "entity.too.large") {
      return res.status(413).json({
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: "Request body exceeds the 32 KB limit.",
        },
      });
    }

    if (error.status && error.status < 500) {
      return res.status(error.status).json({
        error: {
          code: "INVALID_REQUEST",
          message: error.message,
        },
      });
    }

    console.error("Unhandled backend error:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected server error occurred.",
      },
    });
  });

  return app;
}

module.exports = { createApp };
