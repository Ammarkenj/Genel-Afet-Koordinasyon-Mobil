// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get commonContinue => 'متابعة';

  @override
  String get commonBack => 'رجوع';

  @override
  String get commonClose => 'إغلاق';

  @override
  String get commonYes => 'نعم';

  @override
  String get commonNo => 'لا';

  @override
  String get commonSample => 'بيانات تجريبية';

  @override
  String get commonOn => 'يعمل';

  @override
  String get commonOff => 'متوقف';

  @override
  String commonStep(int n, int total) {
    return 'الخطوة $n من $total';
  }

  @override
  String get onbTagline =>
      'معك في الزلزال والحادث والسقوط والحريق، حتى بلا إنترنت.';

  @override
  String get onbChooseLang => 'Dil seçin · اختر اللغة';

  @override
  String get onbPermTitle => 'الأذونات';

  @override
  String get onbPermLead =>
      'نحتاج هذه الأذونات لنتمكن من الوصول إليك وقت الطوارئ. يمكنك إيقافها متى شئت.';

  @override
  String get onbKvkk =>
      'قرأت نص الإفصاح وفق قانون حماية البيانات (KVKK)، وأوافق على مشاركة موقعي ومعلوماتي الصحية مع الجهات المختصة وقت الطوارئ.';

  @override
  String get onbKvkkNeeded => 'المتابعة تتطلب الموافقة.';

  @override
  String get permLocation => 'الموقع';

  @override
  String get permLocationDesc => 'لإرفاق موقعك بالبلاغ وإظهار أقرب نقطة تجمّع.';

  @override
  String get permNotif => 'الإشعارات';

  @override
  String get permNotifDesc => 'لتنبيهك بالزلازل وبحالة إرسال بلاغاتك.';

  @override
  String get permSensor => 'حسّاسات الحركة';

  @override
  String get permSensorDesc =>
      'لاكتشاف الاهتزاز الشديد أو الحادث أو السقوط المفاجئ تلقائياً.';

  @override
  String get loginTitle => 'تسجيل الدخول';

  @override
  String get loginLead => 'سجّل الدخول برقم هاتفك لتُربط بلاغاتك بملفك الشخصي.';

  @override
  String get loginPhone => 'رقم الهاتف';

  @override
  String get loginPhoneHint => 'مثال: 5XX XXX XX XX';

  @override
  String get loginPhoneError =>
      'رقم الهاتف يجب أن يكون 10 أرقام ويبدأ بالرقم 5.';

  @override
  String get loginSendCode => 'إرسال رمز التحقق';

  @override
  String get loginCode => 'رمز التحقق (6 أرقام)';

  @override
  String get loginCodeHint => 'أُرسل عبر SMS. في النموذج يُقبل أي 6 أرقام.';

  @override
  String get loginCodeError => 'الرمز يجب أن يكون 6 أرقام.';

  @override
  String get loginSubmit => 'دخول';

  @override
  String get loginChangeNumber => 'تغيير الرقم';

  @override
  String get loginGuest => 'المتابعة بلا تسجيل';

  @override
  String get loginGuestNote => 'خصائص الطوارئ تعمل حتى بلا تسجيل دخول.';

  @override
  String get navLabel => 'التنقل الرئيسي';

  @override
  String get navHome => 'الرئيسية';

  @override
  String get navMap => 'الخريطة';

  @override
  String get navTools => 'الأدوات';

  @override
  String get navDonate => 'التبرع';

  @override
  String get navProfile => 'الملف';

  @override
  String get netOnline => 'متصل';

  @override
  String get netOnlineDesc => 'تُرسل البلاغات فوراً.';

  @override
  String get netWeak => 'اتصال ضعيف';

  @override
  String get netWeakDesc => 'قد يتأخر الإرسال، لكن بلاغك لن يضيع.';

  @override
  String get netOffline => 'غير متصل';

  @override
  String get netOfflineDesc =>
      'تُحفظ البلاغات في الجهاز وتُرسل عند عودة الاتصال.';

  @override
  String netQueued(int n) {
    return 'بلاغات في الانتظار: $n';
  }

  @override
  String get homeAlerts => 'التنبيهات';

  @override
  String get homePrompt => 'أبلِغ عن حالتك';

  @override
  String get homeHelp => 'أحتاج مساعدة';

  @override
  String get homeHelpSub => 'يُرسل البلاغ مع موقعك';

  @override
  String get homeSafe => 'أنا بخير';

  @override
  String get homeQuick => 'أدوات سريعة';

  @override
  String get homeSiren => 'صفّارة';

  @override
  String get homeFlash => 'فلاش SOS';

  @override
  String get homeCall => 'اتصل بـ 112';

  @override
  String get homeAfadTitle => 'آخر زلزال (AFAD)';

  @override
  String get homeAfadMag => 'القوة';

  @override
  String get homeAfadPlace => 'سيفريجه، إلازيغ';

  @override
  String get homeAfadMeta => 'قبل 12 دقيقة · عمق 7 كم';

  @override
  String get homeRecent => 'آخر بلاغاتي';

  @override
  String get homeNoReports => 'لا بلاغات بعد.';

  @override
  String get typeQuake => 'زلزال';

  @override
  String get typeCrash => 'حادث مروري';

  @override
  String get typeFall => 'سقوط مفاجئ';

  @override
  String get typeFire => 'حريق';

  @override
  String get typeOther => 'طارئ آخر';

  @override
  String get kindHelp => 'أحتاج مساعدة';

  @override
  String get kindSafe => 'أنا بخير';

  @override
  String get rstateSent => 'أُرسل';

  @override
  String get rstateQueued => 'في الانتظار';

  @override
  String get rstateSending => 'جارٍ الإرسال';

  @override
  String get selectTitle => 'ماذا حدث؟';

  @override
  String get selectLead => 'اختر واحداً، وسيُرسل البلاغ فوراً.';

  @override
  String get statusSentTitle => 'أُرسل بلاغك';

  @override
  String get statusSentDesc => 'استلم مركز الأزمات موقعك وحالتك.';

  @override
  String get statusQueuedTitle => 'حُفظ بلاغك';

  @override
  String get statusQueuedDesc =>
      'لا يوجد إنترنت. سيُرسل تلقائياً عند عودة الاتصال، وسنحاول عبر SMS أيضاً.';

  @override
  String get statusSendingTitle => 'جارٍ الإرسال…';

  @override
  String get statusSendingDesc => 'الاتصال ضعيف. بلاغك محفوظ في الجهاز.';

  @override
  String get statusAuto => 'أُرسل تلقائياً لأنك لم تستجب.';

  @override
  String get statusKind => 'الحالة';

  @override
  String get statusType => 'الحدث';

  @override
  String get statusTime => 'الوقت';

  @override
  String get statusLocation => 'الموقع';

  @override
  String get statusDelivery => 'الإرسال';

  @override
  String get statusMore => 'معلومات إضافية (اختياري)';

  @override
  String get statusInjured => 'هل يوجد مصابون؟';

  @override
  String get statusTrapped => 'هل أنت محاصَر؟';

  @override
  String get statusPeople => 'عدد الأشخاص';

  @override
  String get statusDecrease => 'إنقاص واحد';

  @override
  String get statusIncrease => 'زيادة واحد';

  @override
  String get statusShowArea => 'أظهر نقطة التجمّع';

  @override
  String get statusHome => 'العودة للرئيسية';

  @override
  String get statusUndo => 'أرسلته بالخطأ — إلغاء';

  @override
  String get statusNone => 'لا يوجد بلاغ لعرضه.';

  @override
  String get confirmTitle => 'إلغاء البلاغ؟';

  @override
  String get confirmDesc => 'سيُبلَّغ مركز الأزمات بأن بلاغك أُلغي.';

  @override
  String get confirmYes => 'نعم، ألغِ البلاغ';

  @override
  String get confirmNo => 'لا، أبقِ البلاغ';

  @override
  String get cdQuake => 'رُصد اهتزاز شديد';

  @override
  String get cdCrash => 'رُصد حادث';

  @override
  String get cdFall => 'رُصد سقوط مفاجئ';

  @override
  String get cdDesc => 'إن لم تستجب، سيُرسل موقعك وحالتك تلقائياً.';

  @override
  String get cdTimer => 'الوقت المتبقي';

  @override
  String get cdSeconds => 'ثانية';

  @override
  String get cdCancel => 'أنا بخير — إلغاء';

  @override
  String get cdNow => 'اطلب المساعدة الآن';

  @override
  String get afadTitle => 'تنبيه زلزال';

  @override
  String get afadBody => 'AFAD: القوة 5.4 — سيفريجه، إلازيغ. قبل دقيقتين.';

  @override
  String get afadAsk => 'ما حالتك؟';

  @override
  String get toastCdCancelled => 'أُلغي العدّاد. لم يُرسل أي بلاغ.';

  @override
  String toastSynced(int n) {
    return 'أُرسلت البلاغات المنتظرة: $n';
  }

  @override
  String get toastReportCancelled => 'أُلغي البلاغ.';

  @override
  String get toastCall => 'جارٍ الاتصال بـ 112… (نموذج)';

  @override
  String get toastLoggedOut => 'تم تسجيل الخروج.';

  @override
  String get toastProto => 'هذا الإجراء غير مفعّل في النموذج.';

  @override
  String get toastVolJoined => 'تم تسجيلك متطوعاً.';

  @override
  String get mapTitle => 'نقاط التجمّع';

  @override
  String get mapAlt => 'خريطة: موقعك وثلاث نقاط تجمّع مرقّمة';

  @override
  String get mapOffline => 'خريطة بلا إنترنت — منطقة محفوظة';

  @override
  String get mapOnline => 'الخريطة محدَّثة';

  @override
  String get mapNearest => 'الأقرب';

  @override
  String get mapSelected => 'النقطة المختارة';

  @override
  String mapWalk(int m, int min) {
    return '$m م · $min د مشياً';
  }

  @override
  String get mapStart => 'ابدأ المسار';

  @override
  String get mapStop => 'أوقف المسار';

  @override
  String get mapRouteOn => 'المسار معروض على الخريطة';

  @override
  String get mapAll => 'كل النقاط';

  @override
  String get area1 => 'نقطة تجمّع حديقة الثقافة';

  @override
  String get area2 => 'ملعب الحرم الجامعي';

  @override
  String get area3 => 'ساحة البلدية';

  @override
  String get toolsTitle => 'أدوات الطوارئ';

  @override
  String get toolsSirenTitle => 'صفّارة الإنذار';

  @override
  String get toolsSirenDesc =>
      'صوت عالٍ يلفت الانتباه ويدلّ على مكانك تحت الأنقاض.';

  @override
  String get toolsSirenOn => 'الصفّارة تعمل';

  @override
  String get toolsFlashTitle => 'فلاش SOS';

  @override
  String get toolsFlashDesc => 'يرسل إشارة SOS بفلاش الكاميرا.';

  @override
  String get toolsFlashOn => 'الفلاش يومض';

  @override
  String get toolsStart => 'تشغيل';

  @override
  String get toolsStop => 'إيقاف';

  @override
  String get toolsSmsTitle => 'بلاغ عبر SMS';

  @override
  String get toolsSmsDesc =>
      'عند انقطاع الإنترنت تُرسل حالتك إلى جهات اتصال الطوارئ عبر SMS.';

  @override
  String get donateTitle => 'تبرّع آمن';

  @override
  String get donateSecure => 'تُرسل بيانات الدفع مشفّرة ولا تُحفظ في الجهاز.';

  @override
  String get donateOffline =>
      'التبرع يتطلب اتصالاً بالإنترنت. أعد المحاولة عند عودة الاتصال.';

  @override
  String get donatePurpose => 'وجهة التبرع';

  @override
  String get fundFood => 'غذاء وماء عاجل';

  @override
  String get fundFoodDesc => 'احتياجات أساسية لمنطقة الكارثة';

  @override
  String get fundShelter => 'إيواء';

  @override
  String get fundShelterDesc => 'خيام، بطانيات، مدافئ';

  @override
  String get fundRescue => 'بحث وإنقاذ';

  @override
  String get fundRescueDesc => 'معدّات ودعم المتطوعين';

  @override
  String get donateAmount => 'المبلغ';

  @override
  String get donateCustom => 'مبلغ آخر (₺)';

  @override
  String get donateCustomHint =>
      'الحد الأدنى 10 ₺. إن تركته فارغاً يُعتمد المبلغ المختار أعلاه.';

  @override
  String get donateCustomError => 'المبلغ يجب ألا يقل عن 10 ₺.';

  @override
  String get donateMethod => 'طريقة الدفع';

  @override
  String get donateCard => 'بطاقة بنكية / ائتمانية';

  @override
  String get donateTransfer => 'حوالة بنكية';

  @override
  String get donateTotal => 'الإجمالي';

  @override
  String get donateConfirm => 'تأكيد التبرع';

  @override
  String get donateProcessing => 'جارٍ التنفيذ…';

  @override
  String get donateDoneTitle => 'استلمنا تبرعك';

  @override
  String get donateDoneDesc => 'شكراً لك. رقم الإيصال في الأسفل.';

  @override
  String get donateReceipt => 'رقم الإيصال';

  @override
  String get donateProto => 'هذا نموذج تجريبي؛ لا يُسحب أي مبلغ حقيقي.';

  @override
  String get donateAgain => 'تبرع جديد';

  @override
  String get profileTitle => 'الملف الشخصي';

  @override
  String get profileEdit => 'تعديل';

  @override
  String get profilePersonal => 'البيانات الشخصية';

  @override
  String get profileName => 'الاسم الكامل';

  @override
  String get profileNameVal => 'مستخدم تجريبي';

  @override
  String get profilePhone => 'الهاتف';

  @override
  String get profileMedical => 'المعلومات الصحية';

  @override
  String get profileMedicalNote => 'ترى فرق الإنقاذ هذه المعلومات مع بلاغك.';

  @override
  String get profileBlood => 'فصيلة الدم';

  @override
  String get profileChronic => 'أمراض مزمنة';

  @override
  String get profileChronicVal => 'ربو';

  @override
  String get profileAllergy => 'حساسية';

  @override
  String get profileAllergyVal => 'بنسلين';

  @override
  String get profileContacts => 'جهات اتصال الطوارئ';

  @override
  String get profileContact1 => 'الأم';

  @override
  String get profileContact2 => 'الأخ';

  @override
  String profileCallContact(String name) {
    return 'اتصال: $name';
  }

  @override
  String get profileAddContact => 'إضافة جهة اتصال';

  @override
  String get profileSettings => 'الإعدادات';

  @override
  String get profileLang => 'اللغة';

  @override
  String get profileTheme => 'المظهر';

  @override
  String get profileLight => 'فاتح';

  @override
  String get profileDark => 'داكن';

  @override
  String get profileAuto => 'الكشف التلقائي';

  @override
  String get profileAutoDesc =>
      'عند رصد اهتزاز أو حادث أو سقوط يبدأ عدّاد 60 ثانية.';

  @override
  String get profileSms => 'SMS احتياطي';

  @override
  String get profileSmsDesc =>
      'أرسل SMS إلى جهات اتصال الطوارئ عند انقطاع الإنترنت.';

  @override
  String get profilePrivacy => 'بياناتك محفوظة مشفّرة في الجهاز (KVKK).';

  @override
  String get profileLogout => 'تسجيل الخروج';

  @override
  String get volSection => 'التطوع';

  @override
  String get volEntryJoin => 'كن متطوعاً';

  @override
  String get volEntryHub => 'لوحة المتطوّع';

  @override
  String get volEntrySub => 'ساند المحتاجين القريبين منك';

  @override
  String get volJoinTitle => 'كن متطوعاً';

  @override
  String get volJoinLead => 'اختر دورك لتساند المحتاجين في منطقة الكارثة.';

  @override
  String get volRole => 'دورك';

  @override
  String get volRoleAid => 'الإسعافات الأولية';

  @override
  String get volRoleAidDesc => 'إسعاف أولي للمصابين';

  @override
  String get volRoleRescue => 'البحث والإنقاذ';

  @override
  String get volRoleRescueDesc => 'الأنقاض والمحاصَرون';

  @override
  String get volRoleLogistics => 'الإمداد والإيواء';

  @override
  String get volRoleLogisticsDesc => 'توزيع الماء والغذاء والخيام';

  @override
  String get volCert => 'لدي شهادة ذات صلة (مثل شهادة إسعاف أولي)';

  @override
  String get volLocationNote =>
      'يُشارك موقعك مع الجهات المختصة فقط حين يكون «أنا متاح» مفعّلاً (KVKK).';

  @override
  String get volJoinBtn => 'سجّلني متطوعاً';

  @override
  String get volHubTitle => 'لوحة المتطوّع';

  @override
  String get volStatus => 'حالتك';

  @override
  String get volAvailable => 'أنا متاح';

  @override
  String get volAvailableOn => 'تظهر لك الاحتياجات القريبة منك.';

  @override
  String get volAvailableOff => 'مطابقة المهام متوقفة.';

  @override
  String get volCertLabel => 'الشهادة';

  @override
  String get volCertYes => 'موجودة';

  @override
  String get volCertNo => 'غير موجودة';

  @override
  String get volLocShare => 'مشاركة الموقع';

  @override
  String get volNeeds => 'احتياجات قريبة';

  @override
  String get volUnavailable =>
      'أنت غير متاح. فعّل «أنا متاح» لترى قائمة الاحتياجات.';

  @override
  String get volActiveTask => 'مهمتك الحالية';

  @override
  String get volOfflineDesc =>
      'تُعرض آخر الاحتياجات المطابقة. المهمة التي تقبلها تُحفظ في الجهاز وتُرسل عند عودة الاتصال.';

  @override
  String get volTaskWaiting => 'قبول مهمة في الانتظار: 1';

  @override
  String get volUrgency => 'الإلحاح';

  @override
  String get volUrg1 => 'عادي';

  @override
  String get volUrg2 => 'عاجل';

  @override
  String get volUrg3 => 'عاجل جداً';

  @override
  String get needAid => 'دعم إسعاف أولي';

  @override
  String get needAidDesc => 'يحتاج مسنٌّ إلى قياس الضغط والنبض.';

  @override
  String get needAidDist => '350 م';

  @override
  String get needWater => 'توزيع الماء والغذاء';

  @override
  String get needWaterDesc =>
      'إيصال ماء الشرب والغذاء الجاف إلى الأسر في نقطة التجمّع.';

  @override
  String get needWaterDist => '600 م';

  @override
  String get needShelter => 'نصب الخيام';

  @override
  String get needShelterDesc => 'ستُنصب أربع خيام للإيواء المؤقت.';

  @override
  String get needShelterDist => '1.2 كم';

  @override
  String get volNeedTitle => 'تفاصيل الاحتياج';

  @override
  String get volEvent => 'الحدث';

  @override
  String get volEventName => 'زلزال إلازيغ';

  @override
  String get volDistance => 'المسافة';

  @override
  String get volNeedType => 'الاحتياج';

  @override
  String get volAccept => 'اقبل المهمة';

  @override
  String get volToTask => 'اذهب إلى المهمة';

  @override
  String get volBack => 'العودة إلى القائمة';

  @override
  String get volBusy => 'لديك مهمة نشطة. أنهِها أولاً لتقبل مهمة أخرى.';

  @override
  String get volTaskSent => 'تم قبول المهمة';

  @override
  String get volTaskSentDesc => 'استلم مركز الأزمة تكليفك.';

  @override
  String get volTaskQueued => 'حُفظ قبول المهمة';

  @override
  String get volTaskQueuedDesc =>
      'لا إنترنت. سيُرسل تلقائياً عند عودة الاتصال.';

  @override
  String get volTaskSending => 'جارٍ الإرسال…';

  @override
  String get volTaskSendingDesc => 'الاتصال ضعيف. قبولك محفوظ في الجهاز.';

  @override
  String get volTaskDone => 'اكتملت المهمة';

  @override
  String get volTaskDoneDesc => 'شكراً لك. عُلِّم الاحتياج كمُلبّى.';

  @override
  String get volAssigned => 'وقت التكليف';

  @override
  String get volState => 'الحالة';

  @override
  String get volInProgress => 'جارية';

  @override
  String get volCompleted => 'مكتملة';

  @override
  String get volRoute => 'أظهر المسار';

  @override
  String get volComplete => 'علّم المهمة كمكتملة';

  @override
  String get volHubBack => 'العودة إلى لوحة المتطوّع';

  @override
  String get volNoTask => 'لا توجد مهمة مقبولة.';

  @override
  String get volDoneConfirmTitle => 'هل تُعلَّم المهمة كمكتملة؟';

  @override
  String get volDoneConfirmDesc =>
      'يُعلَّم الاحتياج كمُلبّى، ولا يمكن التراجع عن ذلك.';

  @override
  String get volDoneNo => 'لا، تبقى المهمة';

  @override
  String get volDoneYes => 'نعم، اكتملت';

  @override
  String get watchHelp => 'مساعدة';

  @override
  String get watchSafe => 'أنا بخير';

  @override
  String get watchOk => 'أنا بخير';

  @override
  String get watchDone => 'تم';

  @override
  String get watchSent => 'أُرسل';

  @override
  String get watchQueued => 'حُفظ';

  @override
  String get watchQueuedSub => 'بانتظار الاتصال';

  @override
  String get watchSending => 'جارٍ الإرسال';

  @override
  String get watchQuake => 'زلزال 5.4';

  @override
  String get labTitle => 'YaşamHattı — نموذج الواجهة';

  @override
  String get labSub => 'نموذج تصميم تفاعلي';

  @override
  String get labSkip => 'انتقل إلى شاشة الهاتف';

  @override
  String get labLang => 'اللغة';

  @override
  String get labTheme => 'المظهر';

  @override
  String get labNet => 'حالة الشبكة';

  @override
  String get labSim => 'محاكاة';

  @override
  String get labSimQuake => 'محاكاة اهتزاز';

  @override
  String get labSimCrash => 'محاكاة حادث';

  @override
  String get labSimFall => 'محاكاة سقوط';

  @override
  String get labSimAfad => 'إظهار تنبيه AFAD';

  @override
  String get labAutoOff => 'الكشف التلقائي متوقف. فعّله من الملف > الإعدادات.';

  @override
  String get labSpeed => 'سرعة العدّاد';

  @override
  String get labScreens => 'الشاشات';

  @override
  String get labPhone => 'الهاتف';

  @override
  String get labWatch => 'الساعة الذكية (Wear OS)';

  @override
  String get labNote =>
      'كل البيانات تجريبية. الصوت والفلاش و SMS والاتصال والدفع محاكاة.';

  @override
  String get screenOnboarding => 'اللغة والأذونات';

  @override
  String get screenLogin => 'الدخول';

  @override
  String get screenHome => 'الرئيسية';

  @override
  String get screenSelect => 'اختيار الكارثة';

  @override
  String get screenStatus => 'حالة البلاغ';

  @override
  String get screenCountdown => 'عدّاد 60 ثانية';

  @override
  String get screenMap => 'الخريطة';

  @override
  String get screenTools => 'الأدوات';

  @override
  String get screenDonate => 'التبرع';

  @override
  String get screenProfile => 'الملف';

  @override
  String get screenVolJoin => 'تسجيل متطوع';

  @override
  String get screenVolHub => 'لوحة المتطوّع';

  @override
  String get screenVolNeed => 'تفاصيل الاحتياج';

  @override
  String get screenVolTask => 'حالة المهمة';
}
