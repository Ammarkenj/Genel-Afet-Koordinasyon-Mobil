function toApiShelter(shelter) {
  return {
    id: shelter.shelter_id,
    name: shelter.name,
    category: shelter.category,
    capacity: shelter.capacity,
    latitude: shelter.latitude,
    longitude: shelter.longitude,
    features: shelter.features,
  };
}

function toApiGuide(guide) {
  return {
    id: guide.guide_id,
    title: guide.title,
    category: guide.category,
    content: guide.content,
  };
}

class PrismaCatalogRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async listShelters() {
    const shelters = await this.prisma.shelter.findMany({
      orderBy: [{ name: "asc" }, { shelter_id: "asc" }],
    });

    return shelters.map(toApiShelter);
  }

  async listGuides() {
    const guides = await this.prisma.emergencyGuide.findMany({
      orderBy: [{ category: "asc" }, { title: "asc" }, { guide_id: "asc" }],
    });

    return guides.map(toApiGuide);
  }
}

module.exports = { PrismaCatalogRepository };
