# YaşamHattı Backend

Bu klasör, mobil uygulamanın çevrimdışı kuyrukladığı ihbarları REST API üzerinden alacak ilk backend iskeletidir.

## Çalıştırma

Node.js 18 veya üzeri gerekir.

```powershell
npm start
npm test
```

Sunucu varsayılan olarak `0.0.0.0:3000` adresinde çalışır. `PORT` ve `HOST` ortam değişkenleriyle adres değiştirilebilir.

## API

### `GET /api/v1/health`

Servis ve veritabanı bağlantı durumunu bildirir. Veritabanına erişilemiyorsa `503` döner.

### `POST /api/v1/reports`

Yeni bir ihbar kabul eder. İstemci, çevrimdışı kuyrukta tekrar gönderimlerde aynı `clientReportId` değerini kullanmalıdır. Aynı kimlikle gelen tekrarlar ikinci kayıt oluşturmaz.

```json
{
  "clientReportId": "device-generated-unique-id",
  "type": "accident",
  "occurredAt": "2026-10-23T14:30:00.000Z",
  "location": {
    "latitude": 38.68,
    "longitude": 39.22
  },
  "description": "Road accident"
}
```

`type` değerleri: `accident`, `fall`, `fire`, `earthquake`, `help`. `description` isteğe bağlıdır. Kişisel veya gereksiz hassas bilgileri bu alana koymayın.

İlk kayıt `201` ve `duplicate: false`; yinelenen gönderi `200` ve önceki kayıtla birlikte `duplicate: true` döndürür.

## Veritabanı

PostgreSQL bağlantısını `backend/.env` içindeki `DATABASE_URL` değişkeniyle yapılandırın. Bu dosya Git tarafından yok sayılır; bağlantı bilgisini depoya eklemeyin.

Şema değişikliklerini veritabanına uygulamak için:

```powershell
npm run db:migrate
```

Uygulamayı başlatmak artık PostgreSQL'e bağlanmayı gerektirir. API, ihbarları Prisma üzerinden `Report` tablosuna yazar; çevrimdışı tekrar gönderimleri `client_report_id` benzersiz kısıtıyla güvenle tekilleştirilir. Kimlik doğrulama henüz bulunmadığından `user_id` şimdilik boş bırakılabilir.

Bellek içi testler:

```powershell
npm test
```

Gerçek veritabanına bağlanıp ihbar oluşturma, tekrar gönderim, filtreleme, durum güncelleme ve sağlık kontrolünü sınamak için (test kaydı işlem sonunda silinir):

```powershell
npm run test:database
```

## Güvenlik sınırları

Misafirler kimlik doğrulamadan ihbar gönderebilir. Kötüye kullanımı engelleyecek rate limit/abuse kontrolleri henüz eklenmedi; bu nedenle POST endpoint'ini açık internete yayınlamayın. İhbar listeleme ve durum güncelleme endpoint'leri personel kimlik doğrulaması/yetkilendirmesi tasarlanana kadar kapalıdır. AFAD entegrasyonu ve Socket.IO gerçek zamanlı yayın sonraki aşamalardır.
