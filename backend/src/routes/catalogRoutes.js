const express = require("express");
const { createCatalogController } = require("../controllers/catalogController");
const { InMemoryCatalogRepository } = require("../repositories/inMemoryCatalogRepository");

function catalogRoutes({
  catalogRepository = new InMemoryCatalogRepository(),
} = {}) {
  const router = express.Router();
  const controller = createCatalogController(catalogRepository);

  router.get("/shelters", controller.listShelters);
  router.get("/guides", controller.listGuides);

  return router;
}

module.exports = catalogRoutes;
