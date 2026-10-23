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

Servis durumunu ve veritabanının henüz yapılandırılmadığını bildirir.

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

### `GET /api/v1/reports`

İhbarları en yeniden eskiye listeler. `status`, `startDate`, `endDate`, `minLat`, `maxLat`, `minLon`, `maxLon`, `limit` ve `offset` parametreleri desteklenir. Konum filtresi için dört sınırın tamamı verilmelidir. Varsayılan `limit` 20, üst sınır 100'dür.

Örnek: `GET /api/v1/reports?status=new&limit=20&offset=0`

### `PATCH /api/v1/reports/:id/status`

İhbar durumunu geçerli geçişlerle günceller:

- `new` → `reviewing`
- `reviewing` → `assigned` veya `resolved`
- `assigned` → `reviewing` veya `resolved`
- `resolved` son durumdur.

İstek gövdesi: `{ "status": "reviewing" }`

## Geçici depolama ve güvenlik sınırları

İhbarlar şimdilik yalnızca bellekte tutulur; sunucu yeniden başladığında silinir ve birden fazla sunucu örneği arasında paylaşılmaz. Veritabanı bağlantısı özellikle eklenmemiştir. PostgreSQL bağlantısı ve kalıcı repository eklenecek yerler kaynak kodunda `####` işaretiyle belirtilmiştir.

Listeleme ve durum güncelleme endpoint'lerinde henüz kimlik doğrulama/yetkilendirme yoktur. Bu sürümü yalnızca kontrollü yerel geliştirme/test ortamında kullanın; üretime veya açık ağa çıkarmadan önce personel kimlik doğrulaması ve rol yetkilendirmesi eklenmelidir. AFAD entegrasyonu ve Socket.IO gerçek zamanlı yayın da sonraki aşamalardır.
