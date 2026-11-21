const { PrismaClient } = require('@prisma/client');

const emergencyGuides = [
  {
    title: 'Deprem anında ne yapılmalı?',
    category: 'Deprem',
    content: 'Pencerelerden uzak durun ve sağlam eşyaların yanında çök-kapan-tutun pozisyonu alın.',
  },
  {
    title: 'Acil Durum Çantası Hazırlığı',
    category: 'Hazırlık',
    content: 'Çantada su, konserve yiyecek, el feneri, yedek piller ve ilk yardım çantası bulunmalıdır.',
  },
];

const shelters = [
  {
    name: 'Fatih İlkokulu Bahçesi',
    category: 'Okul',
    capacity: 500,
    latitude: 38.681,
    longitude: 39.2264,
    features: 'Yemek, Isıtma, Çadır',
  },
  {
    name: 'Merkez Kapalı Spor Salonu',
    category: 'Spor Salonu',
    capacity: 1500,
    latitude: 38.675,
    longitude: 39.22,
    features: 'Sağlık Ekibi, Battaniye, Jeneratör',
  },
];

async function createIfMissing(delegate, where, data) {
  const existing = await delegate.findFirst({ where });
  if (existing) return false;

  await delegate.create({ data });
  return true;
}

async function seed(prisma) {
  let created = 0;

  for (const guide of emergencyGuides) {
    if (
      await createIfMissing(
        prisma.emergencyGuide,
        { title: guide.title, category: guide.category },
        guide,
      )
    ) {
      created++;
    }
  }

  for (const shelter of shelters) {
    if (
      await createIfMissing(
        prisma.shelter,
        { name: shelter.name, category: shelter.category },
        shelter,
      )
    ) {
      created++;
    }
  }

  return { created };
}

async function main() {
  const prisma = new PrismaClient();

  try {
    const result = await seed(prisma);
    console.log(`Seed tamamlandı; ${result.created} yeni kayıt eklendi.`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Seed başarısız:', error);
    process.exitCode = 1;
  });
}

module.exports = { seed };
