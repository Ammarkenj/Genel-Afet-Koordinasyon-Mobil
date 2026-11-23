const express = require("express");
const authRoutes = require("./routes/authRoutes");
const catalogRoutes = require("./routes/catalogRoutes");
const healthRoutes = require("./routes/healthRoutes");
const reportRoutes = require("./routes/reportRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const { InMemoryAuthRepository } = require("./repositories/inMemoryAuthRepository");
const { InMemoryVolunteerRepository } = require("./repositories/inMemoryVolunteerRepository");

function createApp({
  catalogRepository,
  reportRepository,
  authRepository,
  volunteerRepository,
  smsSender,
  otpPepper,
  databaseClient,
  staffApiToken,
  webAllowedOrigins = process.env.WEB_ALLOWED_ORIGINS || "",
} = {}) {
  const app = express();
  const effectiveAuthRepository =
    authRepository ?? new InMemoryAuthRepository();
  const effectiveVolunteerRepository =
    volunteerRepository ?? new InMemoryVolunteerRepository();
  const allowedOrigins = new Set(
    webAllowedOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );

  app.disable("x-powered-by");
  app.use((req, res, next) => {
    const origin = req.get("origin");
    if (!origin) return next();
    if (!allowedOrigins.has(origin)) {
      return res.status(403).json({
        error: {
          code: "ORIGIN_NOT_ALLOWED",
          message: "The request origin is not allowed.",
        },
      });
    }

    res.set("Access-Control-Allow-Origin", origin);
    res.vary("Origin");
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.set("Access-Control-Max-Age", "600");
      return res.sendStatus(204);
    }
    next();
  });
  app.use(express.json({ limit: "32kb" }));
  app.use("/api/v1/health", healthRoutes({ databaseClient }));
  app.use(
    "/api/v1/auth",
    authRoutes({
      authRepository: effectiveAuthRepository,
      smsSender,
      otpPepper,
    }),
  );
  app.use(
    "/api/v1/volunteers",
    volunteerRoutes({
      authRepository: effectiveAuthRepository,
      volunteerRepository: effectiveVolunteerRepository,
    }),
  );
  app.use("/api/v1", catalogRoutes({ catalogRepository }));
  app.use(
    "/api/v1/reports",
    reportRoutes({ reportRepository, staffApiToken }),
  );

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
          code: error.code ?? "INVALID_REQUEST",
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
