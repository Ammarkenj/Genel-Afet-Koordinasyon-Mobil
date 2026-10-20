/* Design board: lays out every screen state as a labelled frame. Each frame is index.html in export mode,
   driven to its state by query parameters (see applyQuery in app.js).
   board.html?lang=tr|ar&theme=light|dark  ·  &section=N shows one section  ·  &export=1 hides the links. */
(function () {
  'use strict';

  // q: query string that puts the prototype into this state.
  var SECTIONS = [
    { tr: 'Başlangıç ve giriş', ar: 'البداية وتسجيل الدخول', frames: [
      { id: 'onboarding-language', tr: 'Dil seçimi', ar: 'اختيار اللغة', q: 'screen=onboarding' },
      { id: 'onboarding-permissions', tr: 'İzinler ve KVKK onayı', ar: 'الأذونات وموافقة KVKK', q: 'screen=onboarding&step=2' },
      { id: 'onboarding-consent-error', tr: 'İzinler — onay eksik', ar: 'الأذونات — الموافقة ناقصة', q: 'screen=onboarding&step=2&do=togglePerm:location,togglePerm:notif,onbDone' },
      { id: 'login-phone', tr: 'Giriş — telefon', ar: 'الدخول — رقم الهاتف', q: 'screen=login' },
      { id: 'login-phone-error', tr: 'Giriş — hatalı numara', ar: 'الدخول — رقم خاطئ', q: 'screen=login&do=set:phone=123,sendCode' },
      { id: 'login-code', tr: 'Giriş — doğrulama kodu', ar: 'الدخول — رمز التحقق', q: 'screen=login&step=2' }
    ] },
    { tr: 'Durum bildirme', ar: 'الإبلاغ عن الحالة', frames: [
      { id: 'home', tr: 'Ana sayfa', ar: 'الرئيسية', q: 'screen=home' },
      { id: 'home-offline-queue', tr: 'Ana sayfa — çevrimdışı, bekleyen bildirim', ar: 'الرئيسية — غير متصل وبلاغ منتظر', q: 'net=offline&screen=home&do=imSafe,go:home' },
      { id: 'home-toast', tr: 'Ana sayfa — bilgi mesajı (toast)', ar: 'الرئيسية — رسالة إشعار (toast)', q: 'screen=home&toast=1&do=call112' },
      { id: 'select-disaster', tr: 'Afet seçimi', ar: 'اختيار الكارثة', q: 'screen=select' },
      { id: 'status-sent', tr: 'Bildirim gönderildi (ek bilgilerle)', ar: 'أُرسل البلاغ (مع معلومات إضافية)', q: 'screen=home&do=pickType:quake,detail:injured_yes,detail:trapped_no,people:1' },
      { id: 'status-queued', tr: 'Bildirim kaydedildi (çevrimdışı)', ar: 'حُفظ البلاغ (غير متصل)', q: 'net=offline&screen=home&do=pickType:fire' },
      { id: 'status-sending', tr: 'Gönderiliyor (zayıf bağlantı)', ar: 'جارٍ الإرسال (اتصال ضعيف)', q: 'net=weak&hold=1&screen=home&do=pickType:crash' },
      { id: 'status-safe', tr: '"Güvendeyim" gönderildi', ar: 'أُرسل «أنا بخير»', q: 'screen=home&do=imSafe' },
      { id: 'cancel-report-dialog', tr: 'Bildirimi iptal onayı', ar: 'تأكيد إلغاء البلاغ', q: 'screen=home&do=pickType:quake,undoReport' }
    ] },
    { tr: 'Otomatik algılama ve uyarılar', ar: 'الكشف التلقائي والتنبيهات', frames: [
      { id: 'countdown-quake', tr: '60 sn sayaç — sarsıntı', ar: 'عدّاد 60 ثانية — اهتزاز', q: 'screen=home&do=simulate:quake' },
      { id: 'countdown-crash', tr: '60 sn sayaç — kaza', ar: 'عدّاد 60 ثانية — حادث', q: 'screen=home&do=simulate:crash' },
      { id: 'countdown-fall', tr: '60 sn sayaç — ani düşme', ar: 'عدّاد 60 ثانية — سقوط مفاجئ', q: 'screen=home&do=simulate:fall' },
      { id: 'status-auto-sent', tr: 'Sayaç doldu — otomatik bildirim', ar: 'انتهى العدّاد — بلاغ تلقائي', q: 'screen=home&do=simulate:quake,cdExpire' },
      { id: 'afad-alert', tr: 'AFAD deprem uyarısı', ar: 'تنبيه زلزال AFAD', q: 'screen=home&do=showAfad' }
    ] },
    { tr: 'Harita ve araçlar', ar: 'الخريطة والأدوات', frames: [
      { id: 'map', tr: 'Toplanma alanları', ar: 'نقاط التجمّع', q: 'screen=map' },
      { id: 'map-route-offline', tr: 'Rota — çevrimdışı harita', ar: 'المسار — خريطة بلا إنترنت', q: 'net=offline&screen=map&do=toggleRoute' },
      { id: 'tools', tr: 'Acil durum araçları', ar: 'أدوات الطوارئ', q: 'screen=tools' },
      { id: 'tools-active', tr: 'Araçlar — siren ve flaş açık', ar: 'الأدوات — الصفّارة والفلاش يعملان', q: 'screen=tools&do=toggleSiren,toggleFlash' }
    ] },
    { tr: 'Güvenli bağış', ar: 'التبرع الآمن', frames: [
      { id: 'donate', tr: 'Bağış formu', ar: 'نموذج التبرع', q: 'screen=donate' },
      { id: 'donate-error', tr: 'Bağış — hatalı tutar', ar: 'التبرع — مبلغ خاطئ', q: 'screen=donate&do=set:custom=5,donateConfirm' },
      { id: 'donate-processing', tr: 'Bağış — işleniyor', ar: 'التبرع — جارٍ التنفيذ', q: 'screen=donate&hold=1&do=donateConfirm' },
      { id: 'donate-receipt', tr: 'Bağış alındı', ar: 'تم استلام التبرع', q: 'screen=donate&do=fund:shelter,amount:500,donateConfirm' },
      { id: 'donate-offline', tr: 'Bağış — çevrimdışı', ar: 'التبرع — غير متصل', q: 'net=offline&screen=donate' }
    ] },
    { tr: 'Gönüllü', ar: 'التطوع', frames: [
      { id: 'vol-join', tr: 'Gönüllü ol — kayıt', ar: 'التسجيل كمتطوع', q: 'screen=volJoin' },
      { id: 'vol-hub', tr: 'Gönüllü paneli', ar: 'لوحة المتطوّع', q: 'do=volRole:rescue,volCert,volJoin' },
      { id: 'vol-need', tr: 'İhtiyaç detayı', ar: 'تفاصيل الاحتياج', q: 'do=volRole:rescue,volJoin,volNeed:water' },
      { id: 'vol-task', tr: 'Görev kabul edildi', ar: 'تم قبول المهمة', q: 'do=volRole:rescue,volJoin,volNeed:water,volAccept' },
      { id: 'vol-done-dialog', tr: 'Görevi tamamlama onayı', ar: 'تأكيد إكمال المهمة', q: 'do=volRole:rescue,volJoin,volNeed:water,volAccept,volDone' },
      { id: 'vol-offline', tr: 'Gönüllü paneli — çevrimdışı', ar: 'لوحة المتطوّع — غير متصل', q: 'net=offline&do=volRole:rescue,volJoin,volNeed:water,volAccept,go:volHub' }
    ] },
    { tr: 'Profil', ar: 'الملف الشخصي', frames: [
      { id: 'profile', tr: 'Profil ve ayarlar', ar: 'الملف والإعدادات', q: 'screen=profile' }
    ] },
    { tr: 'Akıllı saat (Wear OS)', ar: 'الساعة الذكية (Wear OS)', frames: [
      { id: 'watch-home', kind: 'watch', tr: 'Saat — ana ekran', ar: 'الساعة — الرئيسية', q: 'screen=home' },
      { id: 'watch-countdown', kind: 'watch', tr: 'Saat — sayaç', ar: 'الساعة — العدّاد', q: 'screen=home&do=simulate:quake' },
      { id: 'watch-countdown-fall', kind: 'watch', tr: 'Saat — düşme sayacı', ar: 'الساعة — عدّاد السقوط', q: 'screen=home&do=simulate:fall' },
      { id: 'watch-sent', kind: 'watch', tr: 'Saat — gönderildi', ar: 'الساعة — أُرسل', q: 'screen=home&do=watchHelp' },
      { id: 'watch-queued', kind: 'watch', tr: 'Saat — kaydedildi (çevrimdışı)', ar: 'الساعة — حُفظ (غير متصل)', q: 'net=offline&screen=home&do=watchHelp' },
      { id: 'watch-alert', kind: 'watch', tr: 'Saat — deprem uyarısı', ar: 'الساعة — تنبيه زلزال', q: 'screen=home&do=showAfad' }
    ] }
  ];

  var TEXT = {
    tr: { title: 'YaşamHattı — UI Tasarımı', sub: '{n} ekran · Türkçe · {theme}', light: 'Açık tema', dark: 'Koyu tema',
          otherLang: 'العربية', toLight: 'Açık temaya geç', toDark: 'Koyu temaya geç', open: 'Etkileşimli prototipi aç' },
    ar: { title: 'YaşamHattı — تصميم الواجهة', sub: '{n} شاشة · العربية · {theme}', light: 'المظهر الفاتح', dark: 'المظهر الداكن',
          otherLang: 'Türkçe', toLight: 'المظهر الفاتح', toDark: 'المظهر الداكن', open: 'افتح النموذج التفاعلي' }
  };

  var q = new URLSearchParams(window.location.search);
  var lang = q.get('lang') === 'ar' ? 'ar' : 'tr';
  var theme = q.get('theme') === 'dark' ? 'dark' : 'light';
  var only = q.get('section') === null ? null : Number(q.get('section'));
  var text = TEXT[lang];

  var root = document.documentElement;
  root.lang = lang;
  root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  root.setAttribute('data-theme', theme);
  if (q.get('export') === '1') document.body.classList.add('exporting');
  if (only !== null) document.body.classList.add('single');

  var total = 0;
  SECTIONS.forEach(function (section, si) {
    section.frames.forEach(function (frame, fi) {
      total += 1;
      frame.index = total;
      frame.section = si;
      frame.label = (si + 1) + '.' + (fi + 1);
    });
  });

  document.title = text.title;
  document.getElementById('board-title').textContent = text.title;
  document.getElementById('board-sub').textContent = text.sub.replace('{n}', total).replace('{theme}', text[theme]);

  function link(label, params, file) {
    var a = document.createElement('a');
    a.href = (file || 'board.html') + (params ? '?' + params : '');
    a.textContent = label;
    return a;
  }
  var links = document.getElementById('board-links');
  var otherLang = lang === 'ar' ? 'tr' : 'ar';
  var otherLink = link(text.otherLang, 'lang=' + otherLang + '&theme=' + theme);
  otherLink.lang = otherLang;
  links.appendChild(otherLink);
  links.appendChild(link(theme === 'dark' ? text.toLight : text.toDark, 'lang=' + lang + '&theme=' + (theme === 'dark' ? 'light' : 'dark')));
  links.appendChild(link(text.open, 'lang=' + lang + '&theme=' + theme, 'index.html'));

  var board = document.getElementById('board');
  var iframes = {};
  var shown = [];
  SECTIONS.forEach(function (section, si) {
    if (only !== null && only !== si) return;
    var el = document.createElement('section');
    el.className = 'section';
    var title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = (si + 1) + '. ' + section[lang];
    el.appendChild(title);
    var row = document.createElement('div');
    row.className = 'row';
    section.frames.forEach(function (frame) {
      var kind = frame.kind || 'phone';
      var cell = document.createElement('figure');
      cell.className = 'cell';
      var caption = document.createElement('figcaption');
      var number = document.createElement('strong');
      number.textContent = frame.label;
      caption.appendChild(number);
      caption.appendChild(document.createTextNode(' · ' + frame[lang]));
      var iframe = document.createElement('iframe');
      iframe.title = frame[lang];
      iframe.setAttribute('scrolling', 'no');
      iframe.style.width = (kind === 'watch' ? 268 : 384) + 'px';
      iframe.style.height = (kind === 'watch' ? 360 : 804) + 'px';
      iframe.src = 'index.html?frame=' + kind + '&id=' + frame.id + '&lang=' + lang + '&theme=' + theme + '&' + frame.q;
      cell.appendChild(caption);
      cell.appendChild(iframe);
      row.appendChild(cell);
      iframes[frame.id] = iframe;
      shown.push(frame);
    });
    el.appendChild(row);
    board.appendChild(el);
  });

  // Coordinates are relative to the body box, which is exactly the screenshot when the window matches its size.
  // One PDF page the exact size of the board, so printing gives a single zoomable sheet.
  var pageStyle = document.createElement('style');
  document.head.appendChild(pageStyle);

  function publish() {
    var body = document.body.getBoundingClientRect();
    pageStyle.textContent = '@page { size: ' + Math.ceil(body.width) + 'px ' + (Math.ceil(body.height) + 2) + 'px; margin: 0; }';
    document.getElementById('board-rects').textContent = JSON.stringify({
      lang: lang, theme: theme, sections: SECTIONS.length, total: total, sized: sized,
      width: Math.ceil(body.width), height: Math.ceil(body.height),
      frames: shown.map(function (frame) {
        var r = iframes[frame.id].getBoundingClientRect();
        return { id: frame.id, index: frame.index, section: frame.section, x: Math.round(r.left - body.left), y: Math.round(r.top - body.top), w: Math.round(r.width), h: Math.round(r.height) };
      })
    });
  }

  var sized = 0;
  var seen = {};
  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.source !== 'yasamhatti-frame' || !iframes[data.id]) return;
    iframes[data.id].style.width = data.width + 'px';
    iframes[data.id].style.height = data.height + 'px';
    if (!seen[data.id]) { seen[data.id] = true; sized += 1; }
    publish();
  });
  publish();
})();
