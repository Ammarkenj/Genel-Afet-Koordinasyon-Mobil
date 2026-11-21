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

Misafir ihbar gönderimi IP başına 15 dakikada 10 istekle sınırlandırılır. Limit
aşılırsa `429` ve `RATE_LIMIT_EXCEEDED` kodu döner. Limit sayacı varsayılan olarak
uygulama belleğinde tutulur; yeniden başlatmada sıfırlanır ve birden fazla backend
örneği arasında paylaşılmaz. Çok örnekli dağıtımda paylaşımlı bir rate-limit store
kullanılmalıdır.

### Personel ihbar erişimi

`GET /api/v1/reports` (filtreleme/sayfalama) ve
`PATCH /api/v1/reports/:id/status` uçları `Authorization: Bearer <token>` ister.
Token'ı `backend/.env` dosyasındaki `STAFF_API_TOKEN` değişkeninde veya ortamda
tanımlayın. Token tanımlı değilse bu iki uç `503` döndürür; geçersiz veya eksik
token `401` döndürür. Misafirlerin `POST /api/v1/reports` ihbar gönderimi token
gerektirmez.

Örnek listeleme filtreleri: `status`, `startDate`, `endDate`, `minLat`, `maxLat`,
`minLon`, `maxLon`, `limit` ve `offset`. Durum geçişleri doğrulanır; geçersiz
geçişler `400` döndürür. Token'ı kaynak koduna veya Git'e eklemeyin. Bu paylaşılan
MVP token'ını yalnızca TLS arkasında kullanın; personel bazlı hesap/rol sistemi
henüz yoktur.

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
