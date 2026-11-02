const express = require("express");
const { createDevicesController } = require("../controllers/devicesController");
const { InMemoryDeviceRepository } = require("../repositories/inMemoryDeviceRepository");

function deviceRoutes({ deviceRepository = new InMemoryDeviceRepository() } = {}) {
  const router = express.Router();
  const controller = createDevicesController(deviceRepository);

  router.post("/register", controller.registerDevice);
  router.delete("/:token", controller.unregisterDevice);
  router.get("/stats", controller.getDeviceStats);

  return router;
}

module.exports = deviceRoutes;
