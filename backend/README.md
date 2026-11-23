# YaşamHattı Backend

Bu klasör, mobil uygulamanın çevrimdışı kuyrukladığı ihbarları REST API üzerinden alacak ilk backend iskeletidir.

## Çalıştırma

Node.js 18 veya üzeri gerekir.

```powershell
npm start
npm test
```

Sunucu varsayılan olarak `0.0.0.0:3000` adresinde çalışır. `PORT` ve `HOST` ortam değişkenleriyle adres değiştirilebilir.

Tarayıcıdan yerel Flutter uygulamasına API erişimi için `.env` dosyasına
`WEB_ALLOWED_ORIGINS=http://localhost:5000` ekleyin. CORS yalnızca bu virgülle
ayrılmış tam origin listesine izin verir; varsayılan olarak hiçbir tarayıcı origin'i
izinli değildir. Android/iOS istemcileri `Origin` göndermediğinden bu ayardan
etkilenmez.

## API

### `GET /api/v1/health`

Servis ve veritabanı bağlantı durumunu bildirir. Veritabanına erişilemiyorsa `503` döner.

### Kataloglar

`GET /api/v1/shelters` barınakları; `GET /api/v1/guides` acil durum rehberlerini
PostgreSQL'den okur. Her iki uç da `{ "data": [...] }` biçiminde herkese açık
yanıt verir ve veri değiştirmez. Seed verileri geliştirme/test içindir; gerçek
barınak bilgileriyle güncel tutulmalıdır.

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
`kind` değeri `help` (varsayılan) veya `safe` olabilir. `safe` için `type` null gönderilir. `auto`, `injured`, `trapped` ve `people` alanları isteğe bağlıdır.

İstemci, rapor ayrıntılarını sonradan güncellemek için 32 bayt rastgele `clientUpdateToken` üretip ilk POST isteğiyle gönderebilir. Token açık olarak yanıtlanmaz; sunucuda yalnızca SHA-256 özeti tutulur. `PATCH /api/v1/reports/:id/details` bu token'ı ve güncellenecek ayrıntıları ister; yanlış token veya bulunamayan rapor `404` döndürür.

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

### Telefonla kullanıcı doğrulama (altyapı)

`POST /api/v1/auth/otp/request` Türk telefon numarasını doğrular ve SMS sağlayıcısı
yapılandırıldığında tek kullanımlık kod gönderir. Gövde:

```json
{ "phoneNumber": "0532 111 22 33" }
```

Kod doğrulama uç noktası `POST /api/v1/auth/otp/verify` aynı telefon numarası,
`challengeId` ve altı haneli `code` alır. Başarılı doğrulama 30 gün geçerli bearer
oturumu döndürür; `GET /api/v1/auth/me` oturumu doğrular ve
`POST /api/v1/auth/logout` oturumu iptal eder. Kodlar 5 dakika geçerlidir ve
challenge başına en fazla 5 deneme yapılabilir. Doğrulama kodları veritabanında
`AUTH_OTP_PEPPER` ile HMAC özeti olarak, oturum token'ları ise yalnızca SHA-256
özeti olarak saklanır. `AUTH_OTP_PEPPER` en az 32 karakterlik gizli bir değer
olmalıdır.

SMS sağlayıcısı henüz seçilmediğinden production sunucusunda OTP gönderimi
bilerek etkin değildir; `/otp/request` `503 OTP_DELIVERY_UNAVAILABLE` döndürür
ve doğrulama kodu kaydetmez. Gerçek SMS sağlayıcısı yapılandırılmadan telefonla
giriş tamamlanamaz. Kod isteği IP başına 15 dakikada 5, numara başına 3; kod
doğrulama IP başına 15 dakikada 10 istekle sınırlandırılır. Oturum token'larını
yalnızca TLS üzerinden gönderin.

## Veritabanı

PostgreSQL bağlantısını `backend/.env` içindeki `DATABASE_URL` değişkeniyle yapılandırın. Bu dosya Git tarafından yok sayılır; bağlantı bilgisini depoya eklemeyin.

Şema değişikliklerini veritabanına uygulamak için:

```powershell
npm run db:migrate
```

Telefon doğrulama tablolarını ekleyen `20261123171000_phone_otp_sessions`
migration'ı henüz veritabanına uygulanmadı.

Sabit acil durum rehberlerini ve barınak örneklerini eklemek için:

```powershell
npx prisma db seed
```

Seed mevcut rehberleri `title + category`, barınakları `name + category`
eşleşmesine göre atlar; kullanıcı veya sağlık profili örnekleri oluşturmaz ve
hiçbir kaydı silmez. Eski seed çalıştırmalarından kalan kayıtları otomatik
temizlemez. Seed verileri üretim ortamında gerçek barınak bilgisinin yerine
kullanılmamalıdır.

Uygulamayı başlatmak artık PostgreSQL'e bağlanmayı gerektirir. API, ihbarları Prisma üzerinden `Report` tablosuna yazar; çevrimdışı tekrar gönderimleri `client_report_id` benzersiz kısıtıyla güvenle tekilleştirilir. Misafir raporları kullanıcı hesabına bağlı olmadığından `user_id` boş bırakılabilir.

Bellek içi testler:

```powershell
npm test
```

Gerçek veritabanına bağlanıp ihbar oluşturma, tekrar gönderim, filtreleme, durum güncelleme ve sağlık kontrolünü sınamak için (test kaydı işlem sonunda silinir):

```powershell
npm run test:database
```

## Güvenlik sınırları

Misafirler kimlik doğrulamadan ihbar gönderebilir; POST endpoint'i IP başına 15 dakikada 10 istekle sınırlandırılmıştır. İhbar listeleme ve durum güncelleme uçları ortak `STAFF_API_TOKEN` ile korunur; personel bazlı hesap ve yetkilendirme sistemi henüz yoktur. AFAD entegrasyonu ve Socket.IO gerçek zamanlı yayın sonraki aşamalardır.
