const assert = require("node:assert/strict");
const { test } = require("node:test");
const { seed } = require("../prisma/seed");

function createDelegate() {
  const rows = [];

  return {
    rows,
    async findFirst({ where }) {
      return rows.find((row) =>
        Object.entries(where).every(([key, value]) => row[key] === value),
      );
    },
    async create({ data }) {
      rows.push(data);
    },
  };
}

test("seed can run repeatedly without duplicating guides or shelters", async () => {
  const prisma = {
    emergencyGuide: createDelegate(),
    shelter: createDelegate(),
    user: {
      create() {
        throw new Error("Seed must not create sample users.");
      },
    },
  };

  assert.deepEqual(await seed(prisma), { created: 4 });
  assert.deepEqual(await seed(prisma), { created: 0 });
  assert.equal(prisma.emergencyGuide.rows.length, 2);
  assert.equal(prisma.shelter.rows.length, 2);
});
