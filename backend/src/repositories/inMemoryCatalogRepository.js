class InMemoryCatalogRepository {
  constructor({ shelters = [], guides = [] } = {}) {
    this.shelters = shelters;
    this.guides = guides;
  }

  async listShelters() {
    return this.shelters.map((shelter) => ({ ...shelter }));
  }

  async listGuides() {
    return this.guides.map((guide) => ({ ...guide }));
  }
}

module.exports = { InMemoryCatalogRepository };
