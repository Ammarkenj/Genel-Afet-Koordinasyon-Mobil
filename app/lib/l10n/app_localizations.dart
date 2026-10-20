import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_tr.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('tr'),
  ];

  /// No description provided for @commonContinue.
  ///
  /// In tr, this message translates to:
  /// **'Devam'**
  String get commonContinue;

  /// No description provided for @commonBack.
  ///
  /// In tr, this message translates to:
  /// **'Geri'**
  String get commonBack;

  /// No description provided for @commonClose.
  ///
  /// In tr, this message translates to:
  /// **'Kapat'**
  String get commonClose;

  /// No description provided for @commonYes.
  ///
  /// In tr, this message translates to:
  /// **'Evet'**
  String get commonYes;

  /// No description provided for @commonNo.
  ///
  /// In tr, this message translates to:
  /// **'Hayır'**
  String get commonNo;

  /// No description provided for @commonSample.
  ///
  /// In tr, this message translates to:
  /// **'Örnek veri'**
  String get commonSample;

  /// No description provided for @commonOn.
  ///
  /// In tr, this message translates to:
  /// **'Açık'**
  String get commonOn;

  /// No description provided for @commonOff.
  ///
  /// In tr, this message translates to:
  /// **'Kapalı'**
  String get commonOff;

  /// No description provided for @commonStep.
  ///
  /// In tr, this message translates to:
  /// **'Adım {n} / {total}'**
  String commonStep(int n, int total);

  /// No description provided for @onbTagline.
  ///
  /// In tr, this message translates to:
  /// **'Deprem, kaza, düşme ve yangında internet olmasa bile yanınızda.'**
  String get onbTagline;

  /// No description provided for @onbChooseLang.
  ///
  /// In tr, this message translates to:
  /// **'Dil seçin · اختر اللغة'**
  String get onbChooseLang;

  /// No description provided for @onbPermTitle.
  ///
  /// In tr, this message translates to:
  /// **'İzinler'**
  String get onbPermTitle;

  /// No description provided for @onbPermLead.
  ///
  /// In tr, this message translates to:
  /// **'Acil durumda size ulaşabilmemiz için bu izinler gerekir. İstediğiniz zaman kapatabilirsiniz.'**
  String get onbPermLead;

  /// No description provided for @onbKvkk.
  ///
  /// In tr, this message translates to:
  /// **'KVKK Aydınlatma Metni\'ni okudum; konum ve sağlık bilgilerimin acil durumda yetkili birimlerle paylaşılmasını kabul ediyorum.'**
  String get onbKvkk;

  /// No description provided for @onbKvkkNeeded.
  ///
  /// In tr, this message translates to:
  /// **'Devam etmek için onay gerekir.'**
  String get onbKvkkNeeded;

  /// No description provided for @permLocation.
  ///
  /// In tr, this message translates to:
  /// **'Konum'**
  String get permLocation;

  /// No description provided for @permLocationDesc.
  ///
  /// In tr, this message translates to:
  /// **'Bildiriminize konumunuzu eklemek ve en yakın toplanma alanını göstermek için.'**
  String get permLocationDesc;

  /// No description provided for @permNotif.
  ///
  /// In tr, this message translates to:
  /// **'Bildirimler'**
  String get permNotif;

  /// No description provided for @permNotifDesc.
  ///
  /// In tr, this message translates to:
  /// **'Deprem uyarılarını ve gönderim durumunu bildirmek için.'**
  String get permNotifDesc;

  /// No description provided for @permSensor.
  ///
  /// In tr, this message translates to:
  /// **'Hareket sensörleri'**
  String get permSensor;

  /// No description provided for @permSensorDesc.
  ///
  /// In tr, this message translates to:
  /// **'Şiddetli sarsıntı, kaza veya ani düşmeyi otomatik algılamak için.'**
  String get permSensorDesc;

  /// No description provided for @loginTitle.
  ///
  /// In tr, this message translates to:
  /// **'Giriş yap'**
  String get loginTitle;

  /// No description provided for @loginLead.
  ///
  /// In tr, this message translates to:
  /// **'Telefon numaranızla giriş yapın; bildirimleriniz profilinizle eşleşsin.'**
  String get loginLead;

  /// No description provided for @loginPhone.
  ///
  /// In tr, this message translates to:
  /// **'Telefon numarası'**
  String get loginPhone;

  /// No description provided for @loginPhoneHint.
  ///
  /// In tr, this message translates to:
  /// **'Örnek: 5XX XXX XX XX'**
  String get loginPhoneHint;

  /// No description provided for @loginPhoneError.
  ///
  /// In tr, this message translates to:
  /// **'Telefon numarası 10 haneli olmalı ve 5 ile başlamalı.'**
  String get loginPhoneError;

  /// No description provided for @loginSendCode.
  ///
  /// In tr, this message translates to:
  /// **'Doğrulama kodu gönder'**
  String get loginSendCode;

  /// No description provided for @loginCode.
  ///
  /// In tr, this message translates to:
  /// **'6 haneli doğrulama kodu'**
  String get loginCode;

  /// No description provided for @loginCodeHint.
  ///
  /// In tr, this message translates to:
  /// **'SMS ile gönderildi. Prototipte herhangi 6 hane kabul edilir.'**
  String get loginCodeHint;

  /// No description provided for @loginCodeError.
  ///
  /// In tr, this message translates to:
  /// **'Kod 6 haneli olmalı.'**
  String get loginCodeError;

  /// No description provided for @loginSubmit.
  ///
  /// In tr, this message translates to:
  /// **'Giriş yap'**
  String get loginSubmit;

  /// No description provided for @loginChangeNumber.
  ///
  /// In tr, this message translates to:
  /// **'Numarayı değiştir'**
  String get loginChangeNumber;

  /// No description provided for @loginGuest.
  ///
  /// In tr, this message translates to:
  /// **'Kayıt olmadan devam et'**
  String get loginGuest;

  /// No description provided for @loginGuestNote.
  ///
  /// In tr, this message translates to:
  /// **'Acil durum özellikleri giriş yapmadan da çalışır.'**
  String get loginGuestNote;

  /// No description provided for @navLabel.
  ///
  /// In tr, this message translates to:
  /// **'Ana gezinme'**
  String get navLabel;

  /// No description provided for @navHome.
  ///
  /// In tr, this message translates to:
  /// **'Ana Sayfa'**
  String get navHome;

  /// No description provided for @navMap.
  ///
  /// In tr, this message translates to:
  /// **'Harita'**
  String get navMap;

  /// No description provided for @navTools.
  ///
  /// In tr, this message translates to:
  /// **'Araçlar'**
  String get navTools;

  /// No description provided for @navDonate.
  ///
  /// In tr, this message translates to:
  /// **'Bağış'**
  String get navDonate;

  /// No description provided for @navProfile.
  ///
  /// In tr, this message translates to:
  /// **'Profil'**
  String get navProfile;

  /// No description provided for @netOnline.
  ///
  /// In tr, this message translates to:
  /// **'Bağlı'**
  String get netOnline;

  /// No description provided for @netOnlineDesc.
  ///
  /// In tr, this message translates to:
  /// **'Bildirimler anında gönderilir.'**
  String get netOnlineDesc;

  /// No description provided for @netWeak.
  ///
  /// In tr, this message translates to:
  /// **'Zayıf bağlantı'**
  String get netWeak;

  /// No description provided for @netWeakDesc.
  ///
  /// In tr, this message translates to:
  /// **'Gönderim yavaş olabilir; bildiriminiz kaybolmaz.'**
  String get netWeakDesc;

  /// No description provided for @netOffline.
  ///
  /// In tr, this message translates to:
  /// **'Çevrimdışı'**
  String get netOffline;

  /// No description provided for @netOfflineDesc.
  ///
  /// In tr, this message translates to:
  /// **'Bildirimler cihazda saklanır, bağlantı gelince gönderilir.'**
  String get netOfflineDesc;

  /// No description provided for @netQueued.
  ///
  /// In tr, this message translates to:
  /// **'Bekleyen bildirim: {n}'**
  String netQueued(int n);

  /// No description provided for @homeAlerts.
  ///
  /// In tr, this message translates to:
  /// **'Uyarılar'**
  String get homeAlerts;

  /// No description provided for @homePrompt.
  ///
  /// In tr, this message translates to:
  /// **'Durumunuzu bildirin'**
  String get homePrompt;

  /// No description provided for @homeHelp.
  ///
  /// In tr, this message translates to:
  /// **'Yardım İstiyorum'**
  String get homeHelp;

  /// No description provided for @homeHelpSub.
  ///
  /// In tr, this message translates to:
  /// **'Konumunuzla birlikte gönderilir'**
  String get homeHelpSub;

  /// No description provided for @homeSafe.
  ///
  /// In tr, this message translates to:
  /// **'Güvendeyim'**
  String get homeSafe;

  /// No description provided for @homeQuick.
  ///
  /// In tr, this message translates to:
  /// **'Hızlı araçlar'**
  String get homeQuick;

  /// No description provided for @homeSiren.
  ///
  /// In tr, this message translates to:
  /// **'Siren'**
  String get homeSiren;

  /// No description provided for @homeFlash.
  ///
  /// In tr, this message translates to:
  /// **'SOS Flaş'**
  String get homeFlash;

  /// No description provided for @homeCall.
  ///
  /// In tr, this message translates to:
  /// **'112\'yi ara'**
  String get homeCall;

  /// No description provided for @homeAfadTitle.
  ///
  /// In tr, this message translates to:
  /// **'Son deprem (AFAD)'**
  String get homeAfadTitle;

  /// No description provided for @homeAfadMag.
  ///
  /// In tr, this message translates to:
  /// **'Büyüklük'**
  String get homeAfadMag;

  /// No description provided for @homeAfadPlace.
  ///
  /// In tr, this message translates to:
  /// **'Sivrice, Elazığ'**
  String get homeAfadPlace;

  /// No description provided for @homeAfadMeta.
  ///
  /// In tr, this message translates to:
  /// **'12 dk önce · 7 km derinlik'**
  String get homeAfadMeta;

  /// No description provided for @homeRecent.
  ///
  /// In tr, this message translates to:
  /// **'Son bildirimlerim'**
  String get homeRecent;

  /// No description provided for @homeNoReports.
  ///
  /// In tr, this message translates to:
  /// **'Henüz bildirim yok.'**
  String get homeNoReports;

  /// No description provided for @typeQuake.
  ///
  /// In tr, this message translates to:
  /// **'Deprem'**
  String get typeQuake;

  /// No description provided for @typeCrash.
  ///
  /// In tr, this message translates to:
  /// **'Trafik kazası'**
  String get typeCrash;

  /// No description provided for @typeFall.
  ///
  /// In tr, this message translates to:
  /// **'Ani düşme'**
  String get typeFall;

  /// No description provided for @typeFire.
  ///
  /// In tr, this message translates to:
  /// **'Yangın'**
  String get typeFire;

  /// No description provided for @typeOther.
  ///
  /// In tr, this message translates to:
  /// **'Diğer acil durum'**
  String get typeOther;

  /// No description provided for @kindHelp.
  ///
  /// In tr, this message translates to:
  /// **'Yardım istiyorum'**
  String get kindHelp;

  /// No description provided for @kindSafe.
  ///
  /// In tr, this message translates to:
  /// **'Güvendeyim'**
  String get kindSafe;

  /// No description provided for @rstateSent.
  ///
  /// In tr, this message translates to:
  /// **'Gönderildi'**
  String get rstateSent;

  /// No description provided for @rstateQueued.
  ///
  /// In tr, this message translates to:
  /// **'Bekliyor'**
  String get rstateQueued;

  /// No description provided for @rstateSending.
  ///
  /// In tr, this message translates to:
  /// **'Gönderiliyor'**
  String get rstateSending;

  /// No description provided for @selectTitle.
  ///
  /// In tr, this message translates to:
  /// **'Ne oldu?'**
  String get selectTitle;

  /// No description provided for @selectLead.
  ///
  /// In tr, this message translates to:
  /// **'Birine dokunun; bildirim hemen gönderilir.'**
  String get selectLead;

  /// No description provided for @statusSentTitle.
  ///
  /// In tr, this message translates to:
  /// **'Bildiriminiz gönderildi'**
  String get statusSentTitle;

  /// No description provided for @statusSentDesc.
  ///
  /// In tr, this message translates to:
  /// **'Kriz merkezi konumunuzu ve durumunuzu aldı.'**
  String get statusSentDesc;

  /// No description provided for @statusQueuedTitle.
  ///
  /// In tr, this message translates to:
  /// **'Bildiriminiz kaydedildi'**
  String get statusQueuedTitle;

  /// No description provided for @statusQueuedDesc.
  ///
  /// In tr, this message translates to:
  /// **'İnternet yok. Bağlantı gelince otomatik gönderilecek; SMS ile de denenecek.'**
  String get statusQueuedDesc;

  /// No description provided for @statusSendingTitle.
  ///
  /// In tr, this message translates to:
  /// **'Gönderiliyor…'**
  String get statusSendingTitle;

  /// No description provided for @statusSendingDesc.
  ///
  /// In tr, this message translates to:
  /// **'Bağlantı zayıf. Bildiriminiz cihazda güvende.'**
  String get statusSendingDesc;

  /// No description provided for @statusAuto.
  ///
  /// In tr, this message translates to:
  /// **'Yanıt vermediğiniz için otomatik gönderildi.'**
  String get statusAuto;

  /// No description provided for @statusKind.
  ///
  /// In tr, this message translates to:
  /// **'Durum'**
  String get statusKind;

  /// No description provided for @statusType.
  ///
  /// In tr, this message translates to:
  /// **'Olay'**
  String get statusType;

  /// No description provided for @statusTime.
  ///
  /// In tr, this message translates to:
  /// **'Saat'**
  String get statusTime;

  /// No description provided for @statusLocation.
  ///
  /// In tr, this message translates to:
  /// **'Konum'**
  String get statusLocation;

  /// No description provided for @statusDelivery.
  ///
  /// In tr, this message translates to:
  /// **'Gönderim'**
  String get statusDelivery;

  /// No description provided for @statusMore.
  ///
  /// In tr, this message translates to:
  /// **'Daha fazla bilgi (isteğe bağlı)'**
  String get statusMore;

  /// No description provided for @statusInjured.
  ///
  /// In tr, this message translates to:
  /// **'Yaralı var mı?'**
  String get statusInjured;

  /// No description provided for @statusTrapped.
  ///
  /// In tr, this message translates to:
  /// **'Mahsur kaldınız mı?'**
  String get statusTrapped;

  /// No description provided for @statusPeople.
  ///
  /// In tr, this message translates to:
  /// **'Kişi sayısı'**
  String get statusPeople;

  /// No description provided for @statusDecrease.
  ///
  /// In tr, this message translates to:
  /// **'Bir azalt'**
  String get statusDecrease;

  /// No description provided for @statusIncrease.
  ///
  /// In tr, this message translates to:
  /// **'Bir artır'**
  String get statusIncrease;

  /// No description provided for @statusShowArea.
  ///
  /// In tr, this message translates to:
  /// **'Toplanma alanını göster'**
  String get statusShowArea;

  /// No description provided for @statusHome.
  ///
  /// In tr, this message translates to:
  /// **'Ana sayfaya dön'**
  String get statusHome;

  /// No description provided for @statusUndo.
  ///
  /// In tr, this message translates to:
  /// **'Yanlışlıkla gönderdim — iptal et'**
  String get statusUndo;

  /// No description provided for @statusNone.
  ///
  /// In tr, this message translates to:
  /// **'Gösterilecek bildirim yok.'**
  String get statusNone;

  /// No description provided for @confirmTitle.
  ///
  /// In tr, this message translates to:
  /// **'Bildirim iptal edilsin mi?'**
  String get confirmTitle;

  /// No description provided for @confirmDesc.
  ///
  /// In tr, this message translates to:
  /// **'Kriz merkezine bildiriminizin iptal edildiği iletilir.'**
  String get confirmDesc;

  /// No description provided for @confirmYes.
  ///
  /// In tr, this message translates to:
  /// **'Evet, iptal et'**
  String get confirmYes;

  /// No description provided for @confirmNo.
  ///
  /// In tr, this message translates to:
  /// **'Hayır, bildirim kalsın'**
  String get confirmNo;

  /// No description provided for @cdQuake.
  ///
  /// In tr, this message translates to:
  /// **'Şiddetli sarsıntı algılandı'**
  String get cdQuake;

  /// No description provided for @cdCrash.
  ///
  /// In tr, this message translates to:
  /// **'Kaza algılandı'**
  String get cdCrash;

  /// No description provided for @cdFall.
  ///
  /// In tr, this message translates to:
  /// **'Ani düşme algılandı'**
  String get cdFall;

  /// No description provided for @cdDesc.
  ///
  /// In tr, this message translates to:
  /// **'Yanıt vermezseniz konumunuz ve durumunuz otomatik gönderilecek.'**
  String get cdDesc;

  /// No description provided for @cdTimer.
  ///
  /// In tr, this message translates to:
  /// **'Kalan süre'**
  String get cdTimer;

  /// No description provided for @cdSeconds.
  ///
  /// In tr, this message translates to:
  /// **'saniye'**
  String get cdSeconds;

  /// No description provided for @cdCancel.
  ///
  /// In tr, this message translates to:
  /// **'İyiyim — iptal et'**
  String get cdCancel;

  /// No description provided for @cdNow.
  ///
  /// In tr, this message translates to:
  /// **'Hemen yardım çağır'**
  String get cdNow;

  /// No description provided for @afadTitle.
  ///
  /// In tr, this message translates to:
  /// **'Deprem uyarısı'**
  String get afadTitle;

  /// No description provided for @afadBody.
  ///
  /// In tr, this message translates to:
  /// **'AFAD: Büyüklük 5.4 — Sivrice, Elazığ. 2 dakika önce.'**
  String get afadBody;

  /// No description provided for @afadAsk.
  ///
  /// In tr, this message translates to:
  /// **'Durumunuz nedir?'**
  String get afadAsk;

  /// No description provided for @toastCdCancelled.
  ///
  /// In tr, this message translates to:
  /// **'Sayaç iptal edildi. Bildirim gönderilmedi.'**
  String get toastCdCancelled;

  /// No description provided for @toastSynced.
  ///
  /// In tr, this message translates to:
  /// **'Bekleyen {n} bildirim gönderildi.'**
  String toastSynced(int n);

  /// No description provided for @toastReportCancelled.
  ///
  /// In tr, this message translates to:
  /// **'Bildirim iptal edildi.'**
  String get toastReportCancelled;

  /// No description provided for @toastCall.
  ///
  /// In tr, this message translates to:
  /// **'112 aranıyor… (prototip)'**
  String get toastCall;

  /// No description provided for @toastLoggedOut.
  ///
  /// In tr, this message translates to:
  /// **'Çıkış yapıldı.'**
  String get toastLoggedOut;

  /// No description provided for @toastProto.
  ///
  /// In tr, this message translates to:
  /// **'Bu işlem prototipte gösterilmez.'**
  String get toastProto;

  /// No description provided for @toastVolJoined.
  ///
  /// In tr, this message translates to:
  /// **'Gönüllü olarak kaydoldunuz.'**
  String get toastVolJoined;

  /// No description provided for @mapTitle.
  ///
  /// In tr, this message translates to:
  /// **'Toplanma alanları'**
  String get mapTitle;

  /// No description provided for @mapAlt.
  ///
  /// In tr, this message translates to:
  /// **'Harita: konumunuz ve numaralı üç toplanma alanı'**
  String get mapAlt;

  /// No description provided for @mapOffline.
  ///
  /// In tr, this message translates to:
  /// **'Çevrimdışı harita — kayıtlı bölge'**
  String get mapOffline;

  /// No description provided for @mapOnline.
  ///
  /// In tr, this message translates to:
  /// **'Harita güncel'**
  String get mapOnline;

  /// No description provided for @mapNearest.
  ///
  /// In tr, this message translates to:
  /// **'En yakın'**
  String get mapNearest;

  /// No description provided for @mapSelected.
  ///
  /// In tr, this message translates to:
  /// **'Seçili alan'**
  String get mapSelected;

  /// No description provided for @mapWalk.
  ///
  /// In tr, this message translates to:
  /// **'{m} m · {min} dk yürüyerek'**
  String mapWalk(int m, int min);

  /// No description provided for @mapStart.
  ///
  /// In tr, this message translates to:
  /// **'Rotayı başlat'**
  String get mapStart;

  /// No description provided for @mapStop.
  ///
  /// In tr, this message translates to:
  /// **'Rotayı durdur'**
  String get mapStop;

  /// No description provided for @mapRouteOn.
  ///
  /// In tr, this message translates to:
  /// **'Rota haritada gösteriliyor'**
  String get mapRouteOn;

  /// No description provided for @mapAll.
  ///
  /// In tr, this message translates to:
  /// **'Tüm alanlar'**
  String get mapAll;

  /// No description provided for @area1.
  ///
  /// In tr, this message translates to:
  /// **'Kültür Park Toplanma Alanı'**
  String get area1;

  /// No description provided for @area2.
  ///
  /// In tr, this message translates to:
  /// **'Üniversite Kampüsü Spor Sahası'**
  String get area2;

  /// No description provided for @area3.
  ///
  /// In tr, this message translates to:
  /// **'Belediye Meydanı'**
  String get area3;

  /// No description provided for @toolsTitle.
  ///
  /// In tr, this message translates to:
  /// **'Acil durum araçları'**
  String get toolsTitle;

  /// No description provided for @toolsSirenTitle.
  ///
  /// In tr, this message translates to:
  /// **'Siren'**
  String get toolsSirenTitle;

  /// No description provided for @toolsSirenDesc.
  ///
  /// In tr, this message translates to:
  /// **'Yüksek sesle dikkat çeker; enkaz altında yerinizi bildirir.'**
  String get toolsSirenDesc;

  /// No description provided for @toolsSirenOn.
  ///
  /// In tr, this message translates to:
  /// **'Siren çalıyor'**
  String get toolsSirenOn;

  /// No description provided for @toolsFlashTitle.
  ///
  /// In tr, this message translates to:
  /// **'SOS Flaş'**
  String get toolsFlashTitle;

  /// No description provided for @toolsFlashDesc.
  ///
  /// In tr, this message translates to:
  /// **'Kamera flaşı ile SOS sinyali verir.'**
  String get toolsFlashDesc;

  /// No description provided for @toolsFlashOn.
  ///
  /// In tr, this message translates to:
  /// **'Flaş yanıp sönüyor'**
  String get toolsFlashOn;

  /// No description provided for @toolsStart.
  ///
  /// In tr, this message translates to:
  /// **'Başlat'**
  String get toolsStart;

  /// No description provided for @toolsStop.
  ///
  /// In tr, this message translates to:
  /// **'Durdur'**
  String get toolsStop;

  /// No description provided for @toolsSmsTitle.
  ///
  /// In tr, this message translates to:
  /// **'SMS ile bildirim'**
  String get toolsSmsTitle;

  /// No description provided for @toolsSmsDesc.
  ///
  /// In tr, this message translates to:
  /// **'İnternet yokken durumunuz acil durum kişilerinize SMS ile gönderilir.'**
  String get toolsSmsDesc;

  /// No description provided for @donateTitle.
  ///
  /// In tr, this message translates to:
  /// **'Güvenli Bağış'**
  String get donateTitle;

  /// No description provided for @donateSecure.
  ///
  /// In tr, this message translates to:
  /// **'Ödeme bilgileriniz şifreli iletilir, cihazda saklanmaz.'**
  String get donateSecure;

  /// No description provided for @donateOffline.
  ///
  /// In tr, this message translates to:
  /// **'Bağış için internet bağlantısı gerekir. Bağlantı gelince tekrar deneyin.'**
  String get donateOffline;

  /// No description provided for @donatePurpose.
  ///
  /// In tr, this message translates to:
  /// **'Bağış amacı'**
  String get donatePurpose;

  /// No description provided for @fundFood.
  ///
  /// In tr, this message translates to:
  /// **'Acil gıda ve su'**
  String get fundFood;

  /// No description provided for @fundFoodDesc.
  ///
  /// In tr, this message translates to:
  /// **'Afet bölgesine temel ihtiyaç'**
  String get fundFoodDesc;

  /// No description provided for @fundShelter.
  ///
  /// In tr, this message translates to:
  /// **'Barınma'**
  String get fundShelter;

  /// No description provided for @fundShelterDesc.
  ///
  /// In tr, this message translates to:
  /// **'Çadır, battaniye, ısıtıcı'**
  String get fundShelterDesc;

  /// No description provided for @fundRescue.
  ///
  /// In tr, this message translates to:
  /// **'Arama kurtarma'**
  String get fundRescue;

  /// No description provided for @fundRescueDesc.
  ///
  /// In tr, this message translates to:
  /// **'Ekipman ve gönüllü desteği'**
  String get fundRescueDesc;

  /// No description provided for @donateAmount.
  ///
  /// In tr, this message translates to:
  /// **'Tutar'**
  String get donateAmount;

  /// No description provided for @donateCustom.
  ///
  /// In tr, this message translates to:
  /// **'Başka tutar (₺)'**
  String get donateCustom;

  /// No description provided for @donateCustomHint.
  ///
  /// In tr, this message translates to:
  /// **'En az 10 ₺. Boş bırakırsanız yukarıdaki tutar geçerli olur.'**
  String get donateCustomHint;

  /// No description provided for @donateCustomError.
  ///
  /// In tr, this message translates to:
  /// **'Tutar en az 10 ₺ olmalı.'**
  String get donateCustomError;

  /// No description provided for @donateMethod.
  ///
  /// In tr, this message translates to:
  /// **'Ödeme yöntemi'**
  String get donateMethod;

  /// No description provided for @donateCard.
  ///
  /// In tr, this message translates to:
  /// **'Banka / kredi kartı'**
  String get donateCard;

  /// No description provided for @donateTransfer.
  ///
  /// In tr, this message translates to:
  /// **'Havale / EFT'**
  String get donateTransfer;

  /// No description provided for @donateTotal.
  ///
  /// In tr, this message translates to:
  /// **'Toplam'**
  String get donateTotal;

  /// No description provided for @donateConfirm.
  ///
  /// In tr, this message translates to:
  /// **'Bağışı onayla'**
  String get donateConfirm;

  /// No description provided for @donateProcessing.
  ///
  /// In tr, this message translates to:
  /// **'İşleniyor…'**
  String get donateProcessing;

  /// No description provided for @donateDoneTitle.
  ///
  /// In tr, this message translates to:
  /// **'Bağışınız alındı'**
  String get donateDoneTitle;

  /// No description provided for @donateDoneDesc.
  ///
  /// In tr, this message translates to:
  /// **'Teşekkür ederiz. Makbuz numaranız aşağıda.'**
  String get donateDoneDesc;

  /// No description provided for @donateReceipt.
  ///
  /// In tr, this message translates to:
  /// **'Makbuz no'**
  String get donateReceipt;

  /// No description provided for @donateProto.
  ///
  /// In tr, this message translates to:
  /// **'Bu bir prototiptir; gerçek ödeme alınmaz.'**
  String get donateProto;

  /// No description provided for @donateAgain.
  ///
  /// In tr, this message translates to:
  /// **'Yeni bağış'**
  String get donateAgain;

  /// No description provided for @profileTitle.
  ///
  /// In tr, this message translates to:
  /// **'Profil'**
  String get profileTitle;

  /// No description provided for @profileEdit.
  ///
  /// In tr, this message translates to:
  /// **'Düzenle'**
  String get profileEdit;

  /// No description provided for @profilePersonal.
  ///
  /// In tr, this message translates to:
  /// **'Kişisel bilgiler'**
  String get profilePersonal;

  /// No description provided for @profileName.
  ///
  /// In tr, this message translates to:
  /// **'Ad Soyad'**
  String get profileName;

  /// No description provided for @profileNameVal.
  ///
  /// In tr, this message translates to:
  /// **'Örnek Kullanıcı'**
  String get profileNameVal;

  /// No description provided for @profilePhone.
  ///
  /// In tr, this message translates to:
  /// **'Telefon'**
  String get profilePhone;

  /// No description provided for @profileMedical.
  ///
  /// In tr, this message translates to:
  /// **'Sağlık bilgileri'**
  String get profileMedical;

  /// No description provided for @profileMedicalNote.
  ///
  /// In tr, this message translates to:
  /// **'Yardım ekipleri bu bilgileri bildiriminizle birlikte görür.'**
  String get profileMedicalNote;

  /// No description provided for @profileBlood.
  ///
  /// In tr, this message translates to:
  /// **'Kan grubu'**
  String get profileBlood;

  /// No description provided for @profileChronic.
  ///
  /// In tr, this message translates to:
  /// **'Kronik hastalık'**
  String get profileChronic;

  /// No description provided for @profileChronicVal.
  ///
  /// In tr, this message translates to:
  /// **'Astım'**
  String get profileChronicVal;

  /// No description provided for @profileAllergy.
  ///
  /// In tr, this message translates to:
  /// **'Alerji'**
  String get profileAllergy;

  /// No description provided for @profileAllergyVal.
  ///
  /// In tr, this message translates to:
  /// **'Penisilin'**
  String get profileAllergyVal;

  /// No description provided for @profileContacts.
  ///
  /// In tr, this message translates to:
  /// **'Acil durum kişileri'**
  String get profileContacts;

  /// No description provided for @profileContact1.
  ///
  /// In tr, this message translates to:
  /// **'Anne'**
  String get profileContact1;

  /// No description provided for @profileContact2.
  ///
  /// In tr, this message translates to:
  /// **'Kardeş'**
  String get profileContact2;

  /// No description provided for @profileCallContact.
  ///
  /// In tr, this message translates to:
  /// **'Ara: {name}'**
  String profileCallContact(String name);

  /// No description provided for @profileAddContact.
  ///
  /// In tr, this message translates to:
  /// **'Kişi ekle'**
  String get profileAddContact;

  /// No description provided for @profileSettings.
  ///
  /// In tr, this message translates to:
  /// **'Ayarlar'**
  String get profileSettings;

  /// No description provided for @profileLang.
  ///
  /// In tr, this message translates to:
  /// **'Dil'**
  String get profileLang;

  /// No description provided for @profileTheme.
  ///
  /// In tr, this message translates to:
  /// **'Tema'**
  String get profileTheme;

  /// No description provided for @profileLight.
  ///
  /// In tr, this message translates to:
  /// **'Açık'**
  String get profileLight;

  /// No description provided for @profileDark.
  ///
  /// In tr, this message translates to:
  /// **'Koyu'**
  String get profileDark;

  /// No description provided for @profileAuto.
  ///
  /// In tr, this message translates to:
  /// **'Otomatik algılama'**
  String get profileAuto;

  /// No description provided for @profileAutoDesc.
  ///
  /// In tr, this message translates to:
  /// **'Sarsıntı, kaza veya düşme algılanınca 60 sn sayaç başlar.'**
  String get profileAutoDesc;

  /// No description provided for @profileSms.
  ///
  /// In tr, this message translates to:
  /// **'SMS yedeği'**
  String get profileSms;

  /// No description provided for @profileSmsDesc.
  ///
  /// In tr, this message translates to:
  /// **'İnternet yokken acil durum kişilerine SMS gönder.'**
  String get profileSmsDesc;

  /// No description provided for @profilePrivacy.
  ///
  /// In tr, this message translates to:
  /// **'Verileriniz cihazda şifreli saklanır (KVKK).'**
  String get profilePrivacy;

  /// No description provided for @profileLogout.
  ///
  /// In tr, this message translates to:
  /// **'Çıkış yap'**
  String get profileLogout;

  /// No description provided for @volSection.
  ///
  /// In tr, this message translates to:
  /// **'Gönüllülük'**
  String get volSection;

  /// No description provided for @volEntryJoin.
  ///
  /// In tr, this message translates to:
  /// **'Gönüllü ol'**
  String get volEntryJoin;

  /// No description provided for @volEntryHub.
  ///
  /// In tr, this message translates to:
  /// **'Gönüllü panelim'**
  String get volEntryHub;

  /// No description provided for @volEntrySub.
  ///
  /// In tr, this message translates to:
  /// **'Yakınınızdaki ihtiyaçlara destek olun'**
  String get volEntrySub;

  /// No description provided for @volJoinTitle.
  ///
  /// In tr, this message translates to:
  /// **'Gönüllü ol'**
  String get volJoinTitle;

  /// No description provided for @volJoinLead.
  ///
  /// In tr, this message translates to:
  /// **'Afet bölgesindeki ihtiyaçlara destek olmak için rolünüzü seçin.'**
  String get volJoinLead;

  /// No description provided for @volRole.
  ///
  /// In tr, this message translates to:
  /// **'Rolünüz'**
  String get volRole;

  /// No description provided for @volRoleAid.
  ///
  /// In tr, this message translates to:
  /// **'İlk yardım'**
  String get volRoleAid;

  /// No description provided for @volRoleAidDesc.
  ///
  /// In tr, this message translates to:
  /// **'Yaralılara ilk müdahale'**
  String get volRoleAidDesc;

  /// No description provided for @volRoleRescue.
  ///
  /// In tr, this message translates to:
  /// **'Arama kurtarma'**
  String get volRoleRescue;

  /// No description provided for @volRoleRescueDesc.
  ///
  /// In tr, this message translates to:
  /// **'Enkaz ve mahsur kalanlar'**
  String get volRoleRescueDesc;

  /// No description provided for @volRoleLogistics.
  ///
  /// In tr, this message translates to:
  /// **'Lojistik ve barınma'**
  String get volRoleLogistics;

  /// No description provided for @volRoleLogisticsDesc.
  ///
  /// In tr, this message translates to:
  /// **'Su, gıda ve çadır dağıtımı'**
  String get volRoleLogisticsDesc;

  /// No description provided for @volCert.
  ///
  /// In tr, this message translates to:
  /// **'İlgili bir sertifikam var (örn. ilk yardım belgesi)'**
  String get volCert;

  /// No description provided for @volLocationNote.
  ///
  /// In tr, this message translates to:
  /// **'Konumunuz yalnızca \"Müsaitim\" açıkken yetkili birimlerle paylaşılır (KVKK).'**
  String get volLocationNote;

  /// No description provided for @volJoinBtn.
  ///
  /// In tr, this message translates to:
  /// **'Gönüllü ol'**
  String get volJoinBtn;

  /// No description provided for @volHubTitle.
  ///
  /// In tr, this message translates to:
  /// **'Gönüllü paneli'**
  String get volHubTitle;

  /// No description provided for @volStatus.
  ///
  /// In tr, this message translates to:
  /// **'Durumunuz'**
  String get volStatus;

  /// No description provided for @volAvailable.
  ///
  /// In tr, this message translates to:
  /// **'Müsaitim'**
  String get volAvailable;

  /// No description provided for @volAvailableOn.
  ///
  /// In tr, this message translates to:
  /// **'Yakınınızdaki ihtiyaçlar gösteriliyor.'**
  String get volAvailableOn;

  /// No description provided for @volAvailableOff.
  ///
  /// In tr, this message translates to:
  /// **'Görev eşleşmesi kapalı.'**
  String get volAvailableOff;

  /// No description provided for @volCertLabel.
  ///
  /// In tr, this message translates to:
  /// **'Sertifika'**
  String get volCertLabel;

  /// No description provided for @volCertYes.
  ///
  /// In tr, this message translates to:
  /// **'Var'**
  String get volCertYes;

  /// No description provided for @volCertNo.
  ///
  /// In tr, this message translates to:
  /// **'Yok'**
  String get volCertNo;

  /// No description provided for @volLocShare.
  ///
  /// In tr, this message translates to:
  /// **'Konum paylaşımı'**
  String get volLocShare;

  /// No description provided for @volNeeds.
  ///
  /// In tr, this message translates to:
  /// **'Yakındaki ihtiyaçlar'**
  String get volNeeds;

  /// No description provided for @volUnavailable.
  ///
  /// In tr, this message translates to:
  /// **'Müsait değilsiniz. İhtiyaç listesini görmek için \"Müsaitim\"i açın.'**
  String get volUnavailable;

  /// No description provided for @volActiveTask.
  ///
  /// In tr, this message translates to:
  /// **'Aktif görev'**
  String get volActiveTask;

  /// No description provided for @volOfflineDesc.
  ///
  /// In tr, this message translates to:
  /// **'Son eşleşen ihtiyaçlar gösteriliyor. Kabul ettiğiniz görev cihazda saklanır, bağlantı gelince gönderilir.'**
  String get volOfflineDesc;

  /// No description provided for @volTaskWaiting.
  ///
  /// In tr, this message translates to:
  /// **'Bekleyen görev kabulü: 1'**
  String get volTaskWaiting;

  /// No description provided for @volUrgency.
  ///
  /// In tr, this message translates to:
  /// **'Aciliyet'**
  String get volUrgency;

  /// No description provided for @volUrg1.
  ///
  /// In tr, this message translates to:
  /// **'Normal'**
  String get volUrg1;

  /// No description provided for @volUrg2.
  ///
  /// In tr, this message translates to:
  /// **'Acil'**
  String get volUrg2;

  /// No description provided for @volUrg3.
  ///
  /// In tr, this message translates to:
  /// **'Çok acil'**
  String get volUrg3;

  /// No description provided for @needAid.
  ///
  /// In tr, this message translates to:
  /// **'İlk yardım desteği'**
  String get needAid;

  /// No description provided for @needAidDesc.
  ///
  /// In tr, this message translates to:
  /// **'Yaşlı bir kişinin tansiyon ve nabız kontrolü gerekiyor.'**
  String get needAidDesc;

  /// No description provided for @needAidDist.
  ///
  /// In tr, this message translates to:
  /// **'350 m'**
  String get needAidDist;

  /// No description provided for @needWater.
  ///
  /// In tr, this message translates to:
  /// **'Su ve gıda dağıtımı'**
  String get needWater;

  /// No description provided for @needWaterDesc.
  ///
  /// In tr, this message translates to:
  /// **'Toplanma alanındaki ailelere içme suyu ve kuru gıda ulaştırılacak.'**
  String get needWaterDesc;

  /// No description provided for @needWaterDist.
  ///
  /// In tr, this message translates to:
  /// **'600 m'**
  String get needWaterDist;

  /// No description provided for @needShelter.
  ///
  /// In tr, this message translates to:
  /// **'Çadır kurulumu'**
  String get needShelter;

  /// No description provided for @needShelterDesc.
  ///
  /// In tr, this message translates to:
  /// **'Geçici barınma için dört çadır kurulacak.'**
  String get needShelterDesc;

  /// No description provided for @needShelterDist.
  ///
  /// In tr, this message translates to:
  /// **'1,2 km'**
  String get needShelterDist;

  /// No description provided for @volNeedTitle.
  ///
  /// In tr, this message translates to:
  /// **'İhtiyaç detayı'**
  String get volNeedTitle;

  /// No description provided for @volEvent.
  ///
  /// In tr, this message translates to:
  /// **'Olay'**
  String get volEvent;

  /// No description provided for @volEventName.
  ///
  /// In tr, this message translates to:
  /// **'Elazığ depremi'**
  String get volEventName;

  /// No description provided for @volDistance.
  ///
  /// In tr, this message translates to:
  /// **'Uzaklık'**
  String get volDistance;

  /// No description provided for @volNeedType.
  ///
  /// In tr, this message translates to:
  /// **'İhtiyaç'**
  String get volNeedType;

  /// No description provided for @volAccept.
  ///
  /// In tr, this message translates to:
  /// **'Görevi kabul et'**
  String get volAccept;

  /// No description provided for @volToTask.
  ///
  /// In tr, this message translates to:
  /// **'Göreve git'**
  String get volToTask;

  /// No description provided for @volBack.
  ///
  /// In tr, this message translates to:
  /// **'Listeye dön'**
  String get volBack;

  /// No description provided for @volBusy.
  ///
  /// In tr, this message translates to:
  /// **'Aktif bir göreviniz var. Başka bir görevi kabul etmek için önce onu tamamlayın.'**
  String get volBusy;

  /// No description provided for @volTaskSent.
  ///
  /// In tr, this message translates to:
  /// **'Görev kabul edildi'**
  String get volTaskSent;

  /// No description provided for @volTaskSentDesc.
  ///
  /// In tr, this message translates to:
  /// **'Kriz merkezi görevlendirmenizi aldı.'**
  String get volTaskSentDesc;

  /// No description provided for @volTaskQueued.
  ///
  /// In tr, this message translates to:
  /// **'Görev kaydedildi'**
  String get volTaskQueued;

  /// No description provided for @volTaskQueuedDesc.
  ///
  /// In tr, this message translates to:
  /// **'İnternet yok. Bağlantı gelince otomatik gönderilecek.'**
  String get volTaskQueuedDesc;

  /// No description provided for @volTaskSending.
  ///
  /// In tr, this message translates to:
  /// **'Gönderiliyor…'**
  String get volTaskSending;

  /// No description provided for @volTaskSendingDesc.
  ///
  /// In tr, this message translates to:
  /// **'Bağlantı zayıf. Kabulünüz cihazda güvende.'**
  String get volTaskSendingDesc;

  /// No description provided for @volTaskDone.
  ///
  /// In tr, this message translates to:
  /// **'Görev tamamlandı'**
  String get volTaskDone;

  /// No description provided for @volTaskDoneDesc.
  ///
  /// In tr, this message translates to:
  /// **'Teşekkür ederiz. İhtiyaç karşılandı olarak işaretlendi.'**
  String get volTaskDoneDesc;

  /// No description provided for @volAssigned.
  ///
  /// In tr, this message translates to:
  /// **'Atanma saati'**
  String get volAssigned;

  /// No description provided for @volState.
  ///
  /// In tr, this message translates to:
  /// **'Durum'**
  String get volState;

  /// No description provided for @volInProgress.
  ///
  /// In tr, this message translates to:
  /// **'Devam ediyor'**
  String get volInProgress;

  /// No description provided for @volCompleted.
  ///
  /// In tr, this message translates to:
  /// **'Tamamlandı'**
  String get volCompleted;

  /// No description provided for @volRoute.
  ///
  /// In tr, this message translates to:
  /// **'Rotayı göster'**
  String get volRoute;

  /// No description provided for @volComplete.
  ///
  /// In tr, this message translates to:
  /// **'Tamamlandı olarak işaretle'**
  String get volComplete;

  /// No description provided for @volHubBack.
  ///
  /// In tr, this message translates to:
  /// **'Gönüllü paneline dön'**
  String get volHubBack;

  /// No description provided for @volNoTask.
  ///
  /// In tr, this message translates to:
  /// **'Kabul edilmiş görev yok.'**
  String get volNoTask;

  /// No description provided for @volDoneConfirmTitle.
  ///
  /// In tr, this message translates to:
  /// **'Görev tamamlandı olarak işaretlensin mi?'**
  String get volDoneConfirmTitle;

  /// No description provided for @volDoneConfirmDesc.
  ///
  /// In tr, this message translates to:
  /// **'İhtiyaç karşılandı olarak işaretlenir. Bu işlem geri alınamaz.'**
  String get volDoneConfirmDesc;

  /// No description provided for @volDoneNo.
  ///
  /// In tr, this message translates to:
  /// **'Hayır, görev sürsün'**
  String get volDoneNo;

  /// No description provided for @volDoneYes.
  ///
  /// In tr, this message translates to:
  /// **'Evet, tamamlandı'**
  String get volDoneYes;

  /// No description provided for @watchHelp.
  ///
  /// In tr, this message translates to:
  /// **'Yardım'**
  String get watchHelp;

  /// No description provided for @watchSafe.
  ///
  /// In tr, this message translates to:
  /// **'Güvendeyim'**
  String get watchSafe;

  /// No description provided for @watchOk.
  ///
  /// In tr, this message translates to:
  /// **'İyiyim'**
  String get watchOk;

  /// No description provided for @watchDone.
  ///
  /// In tr, this message translates to:
  /// **'Tamam'**
  String get watchDone;

  /// No description provided for @watchSent.
  ///
  /// In tr, this message translates to:
  /// **'Gönderildi'**
  String get watchSent;

  /// No description provided for @watchQueued.
  ///
  /// In tr, this message translates to:
  /// **'Kaydedildi'**
  String get watchQueued;

  /// No description provided for @watchQueuedSub.
  ///
  /// In tr, this message translates to:
  /// **'Bağlantı bekleniyor'**
  String get watchQueuedSub;

  /// No description provided for @watchSending.
  ///
  /// In tr, this message translates to:
  /// **'Gönderiliyor'**
  String get watchSending;

  /// No description provided for @watchQuake.
  ///
  /// In tr, this message translates to:
  /// **'Deprem M 5.4'**
  String get watchQuake;

  /// No description provided for @labTitle.
  ///
  /// In tr, this message translates to:
  /// **'YaşamHattı — UI Prototipi'**
  String get labTitle;

  /// No description provided for @labSub.
  ///
  /// In tr, this message translates to:
  /// **'Etkileşimli tasarım prototipi'**
  String get labSub;

  /// No description provided for @labSkip.
  ///
  /// In tr, this message translates to:
  /// **'Telefon ekranına geç'**
  String get labSkip;

  /// No description provided for @labLang.
  ///
  /// In tr, this message translates to:
  /// **'Dil'**
  String get labLang;

  /// No description provided for @labTheme.
  ///
  /// In tr, this message translates to:
  /// **'Tema'**
  String get labTheme;

  /// No description provided for @labNet.
  ///
  /// In tr, this message translates to:
  /// **'Ağ durumu'**
  String get labNet;

  /// No description provided for @labSim.
  ///
  /// In tr, this message translates to:
  /// **'Simülasyon'**
  String get labSim;

  /// No description provided for @labSimQuake.
  ///
  /// In tr, this message translates to:
  /// **'Sarsıntı algıla'**
  String get labSimQuake;

  /// No description provided for @labSimCrash.
  ///
  /// In tr, this message translates to:
  /// **'Kaza algıla'**
  String get labSimCrash;

  /// No description provided for @labSimFall.
  ///
  /// In tr, this message translates to:
  /// **'Düşme algıla'**
  String get labSimFall;

  /// No description provided for @labSimAfad.
  ///
  /// In tr, this message translates to:
  /// **'AFAD uyarısı göster'**
  String get labSimAfad;

  /// No description provided for @labAutoOff.
  ///
  /// In tr, this message translates to:
  /// **'Otomatik algılama kapalı. Profil > Ayarlar\'dan açın.'**
  String get labAutoOff;

  /// No description provided for @labSpeed.
  ///
  /// In tr, this message translates to:
  /// **'Sayaç hızı'**
  String get labSpeed;

  /// No description provided for @labScreens.
  ///
  /// In tr, this message translates to:
  /// **'Ekranlar'**
  String get labScreens;

  /// No description provided for @labPhone.
  ///
  /// In tr, this message translates to:
  /// **'Telefon'**
  String get labPhone;

  /// No description provided for @labWatch.
  ///
  /// In tr, this message translates to:
  /// **'Akıllı saat (Wear OS)'**
  String get labWatch;

  /// No description provided for @labNote.
  ///
  /// In tr, this message translates to:
  /// **'Tüm veriler örnektir. Ses, flaş, SMS, arama ve ödeme simüle edilir.'**
  String get labNote;

  /// No description provided for @screenOnboarding.
  ///
  /// In tr, this message translates to:
  /// **'Dil ve izinler'**
  String get screenOnboarding;

  /// No description provided for @screenLogin.
  ///
  /// In tr, this message translates to:
  /// **'Giriş'**
  String get screenLogin;

  /// No description provided for @screenHome.
  ///
  /// In tr, this message translates to:
  /// **'Ana sayfa'**
  String get screenHome;

  /// No description provided for @screenSelect.
  ///
  /// In tr, this message translates to:
  /// **'Afet seçimi'**
  String get screenSelect;

  /// No description provided for @screenStatus.
  ///
  /// In tr, this message translates to:
  /// **'Bildirim durumu'**
  String get screenStatus;

  /// No description provided for @screenCountdown.
  ///
  /// In tr, this message translates to:
  /// **'60 sn sayaç'**
  String get screenCountdown;

  /// No description provided for @screenMap.
  ///
  /// In tr, this message translates to:
  /// **'Harita'**
  String get screenMap;

  /// No description provided for @screenTools.
  ///
  /// In tr, this message translates to:
  /// **'Araçlar'**
  String get screenTools;

  /// No description provided for @screenDonate.
  ///
  /// In tr, this message translates to:
  /// **'Bağış'**
  String get screenDonate;

  /// No description provided for @screenProfile.
  ///
  /// In tr, this message translates to:
  /// **'Profil'**
  String get screenProfile;

  /// No description provided for @screenVolJoin.
  ///
  /// In tr, this message translates to:
  /// **'Gönüllü kaydı'**
  String get screenVolJoin;

  /// No description provided for @screenVolHub.
  ///
  /// In tr, this message translates to:
  /// **'Gönüllü paneli'**
  String get screenVolHub;

  /// No description provided for @screenVolNeed.
  ///
  /// In tr, this message translates to:
  /// **'İhtiyaç detayı'**
  String get screenVolNeed;

  /// No description provided for @screenVolTask.
  ///
  /// In tr, this message translates to:
  /// **'Görev durumu'**
  String get screenVolTask;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'tr'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'tr':
      return AppLocalizationsTr();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
