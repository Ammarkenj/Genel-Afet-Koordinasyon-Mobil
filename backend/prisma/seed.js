const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Veritabanı başlatılıyor (seeding)...');

  // 1. أدلة الطوارئ
  await prisma.emergencyGuide.createMany({
    data: [
      { title: 'Deprem anında ne yapılmalı?', category: 'Deprem', content: 'Pencerelerden uzak durun ve sağlam eşyaların yanında çök-kapan-tutun pozisyonu alın.' },
      { title: 'Acil Durum Çantası Hazırlığı', category: 'Hazırlık', content: 'Çantada su, konserve yiyecek, el feneri, yedek piller ve ilk yardım çantası bulunmalıdır.' },
    ],
    skipDuplicates: true,
  });

  // 2. الملاجئ
  await prisma.shelter.createMany({
    data: [
      { name: 'Fatih İlkokulu Bahçesi', category: 'Okul', capacity: 500, latitude: 38.6810, longitude: 39.2264, features: 'Yemek, Isıtma, Çadır' },
      { name: 'Merkez Kapalı Spor Salonu', category: 'Spor Salonu', capacity: 1500, latitude: 38.6750, longitude: 39.2200, features: 'Sağlık Ekibi, Battaniye, Jeneratör' },
    ],
    skipDuplicates: true,
  });

  // 3. الأشخاص (مواطن عادي مع ملف طبي وجهة اتصال للطوارئ)
  await prisma.user.create({
    data: {
      full_name: 'Ahmet Yılmaz',
      national_id: '12345678901',
      phone_number: '+905551234567',
      blood_type: 'A+',
      // إنشاء الملف الطبي فوراً مع المستخدم
      medical_profiles: {
        create: {
          chronic_diseases: 'Astım',
          allergies: 'Polen, Toz',
          regular_medications: 'Ventolin'
        }
      },
      // إضافة جهة اتصال للطوارئ
      emergency_contacts: {
        create: {
          contact_name: 'Ayşe Yılmaz',
          contact_phone: '+905559876543',
          relationship: 'Eş'
        }
      }
    }
  });

  // 4. الأشخاص (تسجيل مستخدم كمتطوع في فرق الإنقاذ)
  await prisma.user.create({
    data: {
      full_name: 'Zeynep Demir',
      national_id: '10987654321',
      phone_number: '+905321112233',
      blood_type: '0-',
      // ربطه بجدول المتطوعين مباشرة
      volunteers: {
        create: {
          role_type: 'İlk Yardım Uzmanı',
          certification_status: 'Onaylandı (AFAD)',
          is_available: true
        }
      }
    }
  });

  console.log('✅ Veriler başarıyla eklendi!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });