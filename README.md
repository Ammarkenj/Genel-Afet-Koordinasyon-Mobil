# 🛡️ YaşamHattı — Offline-First Wear OS ve Akıllı Telefon Destekli Acil Durum Koordinasyon Sistemi

> **TÜBİTAK 2209-A** Üniversite Öğrencileri Araştırma Projeleri Destekleme Programı kapsamında geliştirilmektedir.

---

## 📌 Proje Hakkında
**YaşamHattı**, deprem, trafik kazası ve yangın gibi ani gelişen afet durumlarında altyapı çökmelerine bağlı olarak iletişim ağlarının koptuğu anlarda dahi kesintisiz çalışan, **Offline-First (Önce Çevrimdışı)** mimariyle tasarlanmış akıllı bir mobil ve akıllı saat koordinasyon sistemidir. 

Sistem; akıllı telefonlar ve Wear OS akıllı saatlerin **İvmeölçer (Accelerometer)** ve **Jiroskop (Gyroscope)** sensörlerini kullanarak trafik kazası, ani düşme ve yere yığılma durumlarını otomatik algılar. 60 saniyelik güvenlik sayacına kullanıcı yanıt vermediğinde, yerel veritabanında güvenle saklanan konum ve durum verilerini şebeke olmasa bile otomatik olarak kuyruklayarak acil durum kişilerine ve kriz merkezine iletir.

---

## 🚀 Temel Özellikler ve Mimari

* **🔄 Offline-First Mimarisi:** İnternet bağlantısının olmadığı veya zayıf olduğu senaryolarda veriler cihaz yerelindeki **SQLite / Room Persistence Library** veritabanında kayıpsız saklanır.
* **📡 Otomatik Arka Plan Senkronizasyonu:** İnternet bağlantısı sağlandığı anda **WorkManager** servisleri devreye girer ve bekleyen ihbarları *RESTful API* aracılığıyla merkezi sunucuya güvenle aktarır.
* **⌚ Wear OS ve Sensör Entegrasyonu:** Cihaz içi jiroskop ve ivmeölçer verileri anlık işlenerek şiddetli darbe veya ani hız düşüşleri (kaza/düşme) otomatik tespit edilir, 60 saniyelik güvenlik sayacı tetiklenir.
* **🗺️ Çevrimdışı Haritalar & Tile Caching:** İnternet kesilse bile önbelleğe alınmış harita katmanları üzerinden en yakın güvenli toplanma ve barınma alanlarına rota oluşturulur.
* **🚨 Acil Durum Araçları:** Enkaz altındayken ses duyurmak için yüksek sesli **Siren** ve kamera flaşıyla **SOS Sinyali** modülleri.
* **🎨 Afet Odaklı UI/UX:** Yüksek kontrastlı, sade, panik önleyici ve tek dokunuşla çalışan erişilebilir arayüz tasarımı.

---

## 🏗️ Sistem Mimarisi & Teknoloji Yığını

| Katman | Kullanılan Teknolojiler / Araçlar | Açıklama |
| :--- | :--- | :--- |
| **İstemci (Mobil / Saat)** | Kotlin / Flutter, Wear OS API, Room (SQLite) | Şebekesiz ortamlarda veri saklama ve sensör yönetimi. |
| **Senkronizasyon** | WorkManager (Android) | Çevrimdışı kuyruklanan verilerin arka planda sunucuya iletilmesi. |
| **Arka Yüz (Backend)** | Node.js / Python (FastAPI), RESTful API, Socket.io | Kriz merkezi veri yönetimi ve anlık (real-time) harita yayınları. |
| **Veritabanı (Sunucu)** | PostgreSQL | Merkezi ilişkisel veri depolama ve kriz masası analitiği. |

---

## 👥 Proje Ekibi & Görev Dağılımı

| Üye No | Ad Soyad | Rol / Sorumluluk Alanı |
| :---: | :--- | :--- |
| **1** | **Ammar KENJ** *(Takım Kaptanı)* | Proje Mimarı, GitHub & Raporlama Sorumlusu, Genel Koordinasyon |
| **2** | **Muhammed ELDERVİŞ** | Acil Durum, İhbar & Sensör Servisleri (Siren, SOS Flaş, Otomatik Kaza/Düşme Tespiti ve Sayaç) |
| **3** | **Muhammed Hammud ALALAVI** | UI/UX Tasarımcısı & Ön Yüz Geliştirici (Afet Ekranları, Wear OS Arayüzü ve Bağış Paneli) |
| **4** | **Umran MIHYO** | Yerel Veritabanı & Çevrimdışı Senkronizasyon Uzmanı (Room DB, Queue Management, WorkManager) |
| **5** | **Ahmed ELRECEP** | Konum Servisleri & Çevrimdışı Harita Sorumlusu (GPS Takibi, Tile Caching ile Toplanma Alanı Rotalama) |
| **6** | **Mustafa ALJOULAJI** | Arka Yüz (Backend), AFAD Entegrasyonu & Test/Güvenlik QA Sorumlusu (RESTful API, KVKK Testleri) |

---

## 🔗 Proje Bağlantıları
* **Trello Proje Yönetim Panosu:** [Proje Görev Dağılımı ve Sprintler](https://trello.com/b/zK42p72V/afet-ve-acil-durum-koordinasyonu)
* **Kurum:** Fırat Üniversitesi Mühendislik Fakültesi Bilgisayar Mühendisliği Bölümü

---
© 2026 YaşamHattı Proje Ekibi. Tüm hakları saklıdır.
