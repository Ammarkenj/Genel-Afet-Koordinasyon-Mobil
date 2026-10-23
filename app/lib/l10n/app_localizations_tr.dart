// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Turkish (`tr`).
class AppLocalizationsTr extends AppLocalizations {
  AppLocalizationsTr([String locale = 'tr']) : super(locale);

  @override
  String get commonContinue => 'Devam';

  @override
  String get commonBack => 'Geri';

  @override
  String get commonClose => 'Kapat';

  @override
  String get commonYes => 'Evet';

  @override
  String get commonNo => 'Hayır';

  @override
  String get commonSample => 'Örnek veri';

  @override
  String get commonOn => 'Açık';

  @override
  String get commonOff => 'Kapalı';

  @override
  String commonStep(int n, int total) {
    return 'Adım $n / $total';
  }

  @override
  String get onbTagline =>
      'Deprem, kaza, düşme ve yangında internet olmasa bile yanınızda.';

  @override
  String get onbChooseLang => 'Dil seçin · اختر اللغة';

  @override
  String get onbPermTitle => 'İzinler';

  @override
  String get onbPermLead =>
      'Acil durumda size ulaşabilmemiz için bu izinler gerekir. İstediğiniz zaman kapatabilirsiniz.';

  @override
  String get onbKvkk =>
      'KVKK Aydınlatma Metni\'ni okudum; konum ve sağlık bilgilerimin acil durumda yetkili birimlerle paylaşılmasını kabul ediyorum.';

  @override
  String get onbKvkkNeeded => 'Devam etmek için onay gerekir.';

  @override
  String get permLocation => 'Konum';

  @override
  String get permLocationDesc =>
      'Bildiriminize konumunuzu eklemek ve en yakın toplanma alanını göstermek için.';

  @override
  String get permNotif => 'Bildirimler';

  @override
  String get permNotifDesc =>
      'Deprem uyarılarını ve gönderim durumunu bildirmek için.';

  @override
  String get permSensor => 'Hareket sensörleri';

  @override
  String get permSensorDesc =>
      'Şiddetli sarsıntı, kaza veya ani düşmeyi otomatik algılamak için.';

  @override
  String get loginTitle => 'Giriş yap';

  @override
  String get loginLead =>
      'Telefon numaranızla giriş yapın; bildirimleriniz profilinizle eşleşsin.';

  @override
  String get loginPhone => 'Telefon numarası';

  @override
  String get loginPhoneHint => 'Örnek: 5XX XXX XX XX';

  @override
  String get loginPhoneError =>
      'Telefon numarası 10 haneli olmalı ve 5 ile başlamalı.';

  @override
  String get loginSendCode => 'Doğrulama kodu gönder';

  @override
  String get loginCode => '6 haneli doğrulama kodu';

  @override
  String get loginCodeHint =>
      'SMS ile gönderildi. Prototipte herhangi 6 hane kabul edilir.';

  @override
  String get loginCodeError => 'Kod 6 haneli olmalı.';

  @override
  String get loginSubmit => 'Giriş yap';

  @override
  String get loginChangeNumber => 'Numarayı değiştir';

  @override
  String get loginGuest => 'Kayıt olmadan devam et';

  @override
  String get loginGuestNote =>
      'Acil durum özellikleri giriş yapmadan da çalışır.';

  @override
  String get navLabel => 'Ana gezinme';

  @override
  String get navHome => 'Ana Sayfa';

  @override
  String get navMap => 'Harita';

  @override
  String get navTools => 'Araçlar';

  @override
  String get navDonate => 'Bağış';

  @override
  String get navProfile => 'Profil';

  @override
  String get netOnline => 'Bağlı';

  @override
  String get netOnlineDesc => 'Bildirimler anında gönderilir.';

  @override
  String get netWeak => 'Zayıf bağlantı';

  @override
  String get netWeakDesc => 'Gönderim yavaş olabilir; bildiriminiz kaybolmaz.';

  @override
  String get netOffline => 'Çevrimdışı';

  @override
  String get netOfflineDesc =>
      'Bildirimler cihazda saklanır, bağlantı gelince gönderilir.';

  @override
  String netQueued(int n) {
    return 'Bekleyen bildirim: $n';
  }

  @override
  String get homeAlerts => 'Uyarılar';

  @override
  String get homePrompt => 'Durumunuzu bildirin';

  @override
  String get homeHelp => 'Yardım İstiyorum';

  @override
  String get homeHelpSub => 'Konumunuzla birlikte gönderilir';

  @override
  String get homeSafe => 'Güvendeyim';

  @override
  String get homeQuick => 'Hızlı araçlar';

  @override
  String get homeSiren => 'Siren';

  @override
  String get homeFlash => 'SOS Flaş';

  @override
  String get homeCall => '112\'yi ara';

  @override
  String get homeAfadTitle => 'Son deprem (AFAD)';

  @override
  String get homeAfadMag => 'Büyüklük';

  @override
  String get homeAfadPlace => 'Sivrice, Elazığ';

  @override
  String get homeAfadMeta => '12 dk önce · 7 km derinlik';

  @override
  String get homeRecent => 'Son bildirimlerim';

  @override
  String get homeNoReports => 'Henüz bildirim yok.';

  @override
  String get typeQuake => 'Deprem';

  @override
  String get typeCrash => 'Trafik kazası';

  @override
  String get typeFall => 'Ani düşme';

  @override
  String get typeFire => 'Yangın';

  @override
  String get typeOther => 'Diğer acil durum';

  @override
  String get kindHelp => 'Yardım istiyorum';

  @override
  String get kindSafe => 'Güvendeyim';

  @override
  String get rstateSent => 'Gönderildi';

  @override
  String get rstateQueued => 'Bekliyor';

  @override
  String get rstateSending => 'Gönderiliyor';

  @override
  String get selectTitle => 'Ne oldu?';

  @override
  String get selectLead => 'Birine dokunun; bildirim hemen gönderilir.';

  @override
  String get statusSentTitle => 'Bildiriminiz gönderildi';

  @override
  String get statusSentDesc => 'Kriz merkezi konumunuzu ve durumunuzu aldı.';

  @override
  String get statusQueuedTitle => 'Bildiriminiz kaydedildi';

  @override
  String get statusQueuedDesc =>
      'İnternet yok. Bağlantı gelince otomatik gönderilecek; SMS ile de denenecek.';

  @override
  String get statusSendingTitle => 'Gönderiliyor…';

  @override
  String get statusSendingDesc =>
      'Bağlantı zayıf. Bildiriminiz cihazda güvende.';

  @override
  String get statusAuto => 'Yanıt vermediğiniz için otomatik gönderildi.';

  @override
  String get statusKind => 'Durum';

  @override
  String get statusType => 'Olay';

  @override
  String get statusTime => 'Saat';

  @override
  String get statusLocation => 'Konum';

  @override
  String get statusDelivery => 'Gönderim';

  @override
  String get statusMore => 'Daha fazla bilgi (isteğe bağlı)';

  @override
  String get statusInjured => 'Yaralı var mı?';

  @override
  String get statusTrapped => 'Mahsur kaldınız mı?';

  @override
  String get statusPeople => 'Kişi sayısı';

  @override
  String get statusDecrease => 'Bir azalt';

  @override
  String get statusIncrease => 'Bir artır';

  @override
  String get statusShowArea => 'Toplanma alanını göster';

  @override
  String get statusHome => 'Ana sayfaya dön';

  @override
  String get statusUndo => 'Yanlışlıkla gönderdim — iptal et';

  @override
  String get statusNone => 'Gösterilecek bildirim yok.';

  @override
  String get confirmTitle => 'Bildirim iptal edilsin mi?';

  @override
  String get confirmDesc =>
      'Kriz merkezine bildiriminizin iptal edildiği iletilir.';

  @override
  String get confirmYes => 'Evet, iptal et';

  @override
  String get confirmNo => 'Hayır, bildirim kalsın';

  @override
  String get cdQuake => 'Şiddetli sarsıntı algılandı';

  @override
  String get cdCrash => 'Kaza algılandı';

  @override
  String get cdFall => 'Ani düşme algılandı';

  @override
  String get cdDesc =>
      'Yanıt vermezseniz konumunuz ve durumunuz otomatik gönderilecek.';

  @override
  String get cdTimer => 'Kalan süre';

  @override
  String get cdSeconds => 'saniye';

  @override
  String get cdCancel => 'İyiyim — iptal et';

  @override
  String get cdNow => 'Hemen yardım çağır';

  @override
  String get afadTitle => 'Deprem uyarısı';

  @override
  String get afadBody => 'AFAD: Büyüklük 5.4 — Sivrice, Elazığ. 2 dakika önce.';

  @override
  String get afadAsk => 'Durumunuz nedir?';

  @override
  String get toastCdCancelled => 'Sayaç iptal edildi. Bildirim gönderilmedi.';

  @override
  String toastSynced(int n) {
    return 'Bekleyen $n bildirim gönderildi.';
  }

  @override
  String get toastReportCancelled => 'Bildirim iptal edildi.';

  @override
  String get toastCall => '112 aranıyor… (prototip)';

  @override
  String get toastLoggedOut => 'Çıkış yapıldı.';

  @override
  String get toastProto => 'Bu işlem prototipte gösterilmez.';

  @override
  String get toastVolJoined => 'Gönüllü olarak kaydoldunuz.';

  @override
  String get mapTitle => 'Toplanma alanları';

  @override
  String get mapAlt => 'Harita: konumunuz ve numaralı üç toplanma alanı';

  @override
  String get mapOffline => 'Çevrimdışı harita — kayıtlı bölge';

  @override
  String get mapOnline => 'Harita güncel';

  @override
  String get mapNearest => 'En yakın';

  @override
  String get mapSelected => 'Seçili alan';

  @override
  String mapWalk(int m, int min) {
    return '$m m · $min dk yürüyerek';
  }

  @override
  String get mapStart => 'Rotayı başlat';

  @override
  String get mapStop => 'Rotayı durdur';

  @override
  String get mapRouteOn => 'Rota haritada gösteriliyor';

  @override
  String get mapAll => 'Tüm alanlar';

  @override
  String get area1 => 'Kültür Park Toplanma Alanı';

  @override
  String get area2 => 'Üniversite Kampüsü Spor Sahası';

  @override
  String get area3 => 'Belediye Meydanı';

  @override
  String get toolsTitle => 'Acil durum araçları';

  @override
  String get toolsSirenTitle => 'Siren';

  @override
  String get toolsSirenDesc =>
      'Yüksek sesle dikkat çeker; enkaz altında yerinizi bildirir.';

  @override
  String get toolsSirenOn => 'Siren çalıyor';

  @override
  String get toolsFlashTitle => 'SOS Flaş';

  @override
  String get toolsFlashDesc => 'Kamera flaşı ile SOS sinyali verir.';

  @override
  String get toolsFlashOn => 'Flaş yanıp sönüyor';

  @override
  String get toolsStart => 'Başlat';

  @override
  String get toolsStop => 'Durdur';

  @override
  String get toolsSmsTitle => 'SMS ile bildirim';

  @override
  String get toolsSmsDesc =>
      'İnternet yokken durumunuz acil durum kişilerinize SMS ile gönderilir.';

  @override
  String get donateTitle => 'Güvenli Bağış';

  @override
  String get donateSecure =>
      'Ödeme bilgileriniz şifreli iletilir, cihazda saklanmaz.';

  @override
  String get donateOffline =>
      'Bağış için internet bağlantısı gerekir. Bağlantı gelince tekrar deneyin.';

  @override
  String get donatePurpose => 'Bağış amacı';

  @override
  String get fundFood => 'Acil gıda ve su';

  @override
  String get fundFoodDesc => 'Afet bölgesine temel ihtiyaç';

  @override
  String get fundShelter => 'Barınma';

  @override
  String get fundShelterDesc => 'Çadır, battaniye, ısıtıcı';

  @override
  String get fundRescue => 'Arama kurtarma';

  @override
  String get fundRescueDesc => 'Ekipman ve gönüllü desteği';

  @override
  String get donateAmount => 'Tutar';

  @override
  String get donateCustom => 'Başka tutar (₺)';

  @override
  String get donateCustomHint =>
      'En az 10 ₺. Boş bırakırsanız yukarıdaki tutar geçerli olur.';

  @override
  String get donateCustomError => 'Tutar en az 10 ₺ olmalı.';

  @override
  String get donateMethod => 'Ödeme yöntemi';

  @override
  String get donateCard => 'Banka / kredi kartı';

  @override
  String get donateTransfer => 'Havale / EFT';

  @override
  String get donateTotal => 'Toplam';

  @override
  String get donateConfirm => 'Bağışı onayla';

  @override
  String get donateProcessing => 'İşleniyor…';

  @override
  String get donateDoneTitle => 'Bağışınız alındı';

  @override
  String get donateDoneDesc => 'Teşekkür ederiz. Makbuz numaranız aşağıda.';

  @override
  String get donateReceipt => 'Makbuz no';

  @override
  String get donateProto => 'Bu bir prototiptir; gerçek ödeme alınmaz.';

  @override
  String get donateAgain => 'Yeni bağış';

  @override
  String get profileTitle => 'Profil';

  @override
  String get profileEdit => 'Düzenle';

  @override
  String get profilePersonal => 'Kişisel bilgiler';

  @override
  String get profileName => 'Ad Soyad';

  @override
  String get profileNameVal => 'Örnek Kullanıcı';

  @override
  String get profilePhone => 'Telefon';

  @override
  String get profileMedical => 'Sağlık bilgileri';

  @override
  String get profileMedicalNote =>
      'Yardım ekipleri bu bilgileri bildiriminizle birlikte görür.';

  @override
  String get profileBlood => 'Kan grubu';

  @override
  String get profileChronic => 'Kronik hastalık';

  @override
  String get profileChronicVal => 'Astım';

  @override
  String get profileAllergy => 'Alerji';

  @override
  String get profileAllergyVal => 'Penisilin';

  @override
  String get profileContacts => 'Acil durum kişileri';

  @override
  String get profileContact1 => 'Anne';

  @override
  String get profileContact2 => 'Kardeş';

  @override
  String profileCallContact(String name) {
    return 'Ara: $name';
  }

  @override
  String get profileAddContact => 'Kişi ekle';

  @override
  String get profileSettings => 'Ayarlar';

  @override
  String get profileLang => 'Dil';

  @override
  String get profileTheme => 'Tema';

  @override
  String get profileLight => 'Açık';

  @override
  String get profileDark => 'Koyu';

  @override
  String get profileAuto => 'Otomatik algılama';

  @override
  String get profileAutoDesc =>
      'Sarsıntı, kaza veya düşme algılanınca 60 sn sayaç başlar.';

  @override
  String get profileSms => 'SMS yedeği';

  @override
  String get profileSmsDesc =>
      'İnternet yokken acil durum kişilerine SMS gönder.';

  @override
  String get profilePrivacy => 'Verileriniz cihazda şifreli saklanır (KVKK).';

  @override
  String get profileLogout => 'Çıkış yap';

  @override
  String get volSection => 'Gönüllülük';

  @override
  String get volEntryJoin => 'Gönüllü ol';

  @override
  String get volEntryHub => 'Gönüllü panelim';

  @override
  String get volEntrySub => 'Yakınınızdaki ihtiyaçlara destek olun';

  @override
  String get volJoinTitle => 'Gönüllü ol';

  @override
  String get volJoinLead =>
      'Afet bölgesindeki ihtiyaçlara destek olmak için rolünüzü seçin.';

  @override
  String get volRole => 'Rolünüz';

  @override
  String get volRoleAid => 'İlk yardım';

  @override
  String get volRoleAidDesc => 'Yaralılara ilk müdahale';

  @override
  String get volRoleRescue => 'Arama kurtarma';

  @override
  String get volRoleRescueDesc => 'Enkaz ve mahsur kalanlar';

  @override
  String get volRoleLogistics => 'Lojistik ve barınma';

  @override
  String get volRoleLogisticsDesc => 'Su, gıda ve çadır dağıtımı';

  @override
  String get volCert => 'İlgili bir sertifikam var (örn. ilk yardım belgesi)';

  @override
  String get volLocationNote =>
      'Konumunuz yalnızca \"Müsaitim\" açıkken yetkili birimlerle paylaşılır (KVKK).';

  @override
  String get volJoinBtn => 'Gönüllü ol';

  @override
  String get volHubTitle => 'Gönüllü paneli';

  @override
  String get volStatus => 'Durumunuz';

  @override
  String get volAvailable => 'Müsaitim';

  @override
  String get volAvailableOn => 'Yakınınızdaki ihtiyaçlar gösteriliyor.';

  @override
  String get volAvailableOff => 'Görev eşleşmesi kapalı.';

  @override
  String get volCertLabel => 'Sertifika';

  @override
  String get volCertYes => 'Var';

  @override
  String get volCertNo => 'Yok';

  @override
  String get volLocShare => 'Konum paylaşımı';

  @override
  String get volNeeds => 'Yakındaki ihtiyaçlar';

  @override
  String get volUnavailable =>
      'Müsait değilsiniz. İhtiyaç listesini görmek için \"Müsaitim\"i açın.';

  @override
  String get volActiveTask => 'Aktif görev';

  @override
  String get volOfflineDesc =>
      'Son eşleşen ihtiyaçlar gösteriliyor. Kabul ettiğiniz görev cihazda saklanır, bağlantı gelince gönderilir.';

  @override
  String get volTaskWaiting => 'Bekleyen görev kabulü: 1';

  @override
  String get volUrgency => 'Aciliyet';

  @override
  String get volUrg1 => 'Normal';

  @override
  String get volUrg2 => 'Acil';

  @override
  String get volUrg3 => 'Çok acil';

  @override
  String get needAid => 'İlk yardım desteği';

  @override
  String get needAidDesc =>
      'Yaşlı bir kişinin tansiyon ve nabız kontrolü gerekiyor.';

  @override
  String get needAidDist => '350 m';

  @override
  String get needWater => 'Su ve gıda dağıtımı';

  @override
  String get needWaterDesc =>
      'Toplanma alanındaki ailelere içme suyu ve kuru gıda ulaştırılacak.';

  @override
  String get needWaterDist => '600 m';

  @override
  String get needShelter => 'Çadır kurulumu';

  @override
  String get needShelterDesc => 'Geçici barınma için dört çadır kurulacak.';

  @override
  String get needShelterDist => '1,2 km';

  @override
  String get volNeedTitle => 'İhtiyaç detayı';

  @override
  String get volEvent => 'Olay';

  @override
  String get volEventName => 'Elazığ depremi';

  @override
  String get volDistance => 'Uzaklık';

  @override
  String get volNeedType => 'İhtiyaç';

  @override
  String get volAccept => 'Görevi kabul et';

  @override
  String get volToTask => 'Göreve git';

  @override
  String get volBack => 'Listeye dön';

  @override
  String get volBusy =>
      'Aktif bir göreviniz var. Başka bir görevi kabul etmek için önce onu tamamlayın.';

  @override
  String get volTaskSent => 'Görev kabul edildi';

  @override
  String get volTaskSentDesc => 'Kriz merkezi görevlendirmenizi aldı.';

  @override
  String get volTaskQueued => 'Görev kaydedildi';

  @override
  String get volTaskQueuedDesc =>
      'İnternet yok. Bağlantı gelince otomatik gönderilecek.';

  @override
  String get volTaskSending => 'Gönderiliyor…';

  @override
  String get volTaskSendingDesc => 'Bağlantı zayıf. Kabulünüz cihazda güvende.';

  @override
  String get volTaskDone => 'Görev tamamlandı';

  @override
  String get volTaskDoneDesc =>
      'Teşekkür ederiz. İhtiyaç karşılandı olarak işaretlendi.';

  @override
  String get volAssigned => 'Atanma saati';

  @override
  String get volState => 'Durum';

  @override
  String get volInProgress => 'Devam ediyor';

  @override
  String get volCompleted => 'Tamamlandı';

  @override
  String get volRoute => 'Rotayı göster';

  @override
  String get volComplete => 'Tamamlandı olarak işaretle';

  @override
  String get volHubBack => 'Gönüllü paneline dön';

  @override
  String get volNoTask => 'Kabul edilmiş görev yok.';

  @override
  String get volDoneConfirmTitle => 'Görev tamamlandı olarak işaretlensin mi?';

  @override
  String get volDoneConfirmDesc =>
      'İhtiyaç karşılandı olarak işaretlenir. Bu işlem geri alınamaz.';

  @override
  String get volDoneNo => 'Hayır, görev sürsün';

  @override
  String get volDoneYes => 'Evet, tamamlandı';

  @override
  String get watchHelp => 'Yardım';

  @override
  String get watchSafe => 'Güvendeyim';

  @override
  String get watchOk => 'İyiyim';

  @override
  String get watchDone => 'Tamam';

  @override
  String get watchSent => 'Gönderildi';

  @override
  String get watchQueued => 'Kaydedildi';

  @override
  String get watchQueuedSub => 'Bağlantı bekleniyor';

  @override
  String get watchSending => 'Gönderiliyor';

  @override
  String get watchQuake => 'Deprem M 5.4';

  @override
  String get labTitle => 'YaşamHattı — UI Prototipi';

  @override
  String get labSub => 'Etkileşimli tasarım prototipi';

  @override
  String get labSkip => 'Telefon ekranına geç';

  @override
  String get labLang => 'Dil';

  @override
  String get labTheme => 'Tema';

  @override
  String get labNet => 'Ağ durumu';

  @override
  String get labSim => 'Simülasyon';

  @override
  String get labSimQuake => 'Sarsıntı algıla';

  @override
  String get labSimCrash => 'Kaza algıla';

  @override
  String get labSimFall => 'Düşme algıla';

  @override
  String get labSimAfad => 'AFAD uyarısı göster';

  @override
  String get labAutoOff =>
      'Otomatik algılama kapalı. Profil > Ayarlar\'dan açın.';

  @override
  String get labSpeed => 'Sayaç hızı';

  @override
  String get labScreens => 'Ekranlar';

  @override
  String get labPhone => 'Telefon';

  @override
  String get labWatch => 'Akıllı saat (Wear OS)';

  @override
  String get labNote =>
      'Tüm veriler örnektir. Ses, flaş, SMS, arama ve ödeme simüle edilir.';

  @override
  String get screenOnboarding => 'Dil ve izinler';

  @override
  String get screenLogin => 'Giriş';

  @override
  String get screenHome => 'Ana sayfa';

  @override
  String get screenSelect => 'Afet seçimi';

  @override
  String get screenStatus => 'Bildirim durumu';

  @override
  String get screenCountdown => '60 sn sayaç';

  @override
  String get screenMap => 'Harita';

  @override
  String get screenTools => 'Araçlar';

  @override
  String get screenDonate => 'Bağış';

  @override
  String get screenProfile => 'Profil';

  @override
  String get screenVolJoin => 'Gönüllü kaydı';

  @override
  String get screenVolHub => 'Gönüllü paneli';

  @override
  String get screenVolNeed => 'İhtiyaç detayı';

  @override
  String get screenVolTask => 'Görev durumu';
}
