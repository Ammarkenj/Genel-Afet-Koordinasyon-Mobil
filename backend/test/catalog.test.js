const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createApp } = require("../src/app");
const { PrismaCatalogRepository } = require("../src/repositories/prismaCatalogRepository");

async function startTestServer(t, options) {
  const server = createApp(options).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));

  return `http://127.0.0.1:${server.address().port}`;
}

test("public catalog endpoints return shelters and emergency guides", async (t) => {
  const baseUrl = await startTestServer(t, {
    catalogRepository: {
      async listShelters() {
        return [
          {
            id: "shelter-1",
            name: "Fatih İlkokulu Bahçesi",
            category: "Okul",
            capacity: 500,
            latitude: 38.681,
            longitude: 39.2264,
            features: "Yemek, Isıtma, Çadır",
          },
        ];
      },
      async listGuides() {
        return [
          {
            id: "guide-1",
            title: "Deprem anında ne yapılmalı?",
            category: "Deprem",
            content: "Pencerelerden uzak durun.",
          },
        ];
      },
    },
  });

  const sheltersResponse = await fetch(`${baseUrl}/api/v1/shelters`);
  assert.equal(sheltersResponse.status, 200);
  assert.deepEqual((await sheltersResponse.json()).data, [
    {
      id: "shelter-1",
      name: "Fatih İlkokulu Bahçesi",
      category: "Okul",
      capacity: 500,
      latitude: 38.681,
      longitude: 39.2264,
      features: "Yemek, Isıtma, Çadır",
    },
  ]);

  const guidesResponse = await fetch(`${baseUrl}/api/v1/guides`);
  assert.equal(guidesResponse.status, 200);
  assert.deepEqual((await guidesResponse.json()).data, [
    {
      id: "guide-1",
      title: "Deprem anında ne yapılmalı?",
      category: "Deprem",
      content: "Pencerelerden uzak durun.",
    },
  ]);
});

test("Prisma catalog repository maps database identifiers to API ids", async () => {
  const prisma = {
    shelter: {
      async findMany() {
        return [
          {
            shelter_id: "shelter-1",
            name: "Shelter",
            category: "School",
            capacity: 100,
            latitude: 38.6,
            longitude: 39.2,
            features: null,
          },
        ];
      },
    },
    emergencyGuide: {
      async findMany() {
        return [
          {
            guide_id: "guide-1",
            title: "Guide",
            category: "Safety",
            content: "Stay safe.",
          },
        ];
      },
    },
  };
  const repository = new PrismaCatalogRepository(prisma);

  assert.deepEqual(await repository.listShelters(), [
    {
      id: "shelter-1",
      name: "Shelter",
      category: "School",
      capacity: 100,
      latitude: 38.6,
      longitude: 39.2,
      features: null,
    },
  ]);
  assert.deepEqual(await repository.listGuides(), [
    {
      id: "guide-1",
      title: "Guide",
      category: "Safety",
      content: "Stay safe.",
    },
  ]);
});
