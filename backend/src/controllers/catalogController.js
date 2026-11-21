function createCatalogController(catalogRepository) {
  return {
    async listShelters(_req, res) {
      const shelters = await catalogRepository.listShelters();
      return res.json({ data: shelters });
    },

    async listGuides(_req, res) {
      const guides = await catalogRepository.listGuides();
      return res.json({ data: guides });
    },
  };
}

module.exports = { createCatalogController };
