/* Sample data only. Field names mirror app/lib/domain/models/models.dart (Report, VolunteerNeed, VolunteerTask, AssemblyArea)
   plus dashboard-only fields: ops (new|dispatched|resolved), district, x/y (map percent). */
window.DATA = (function () {
  // [id, kind, type, minutesAgo, delivery, auto, injured, trapped, people, ops, district, x, y]
  const R = [
    [1048, 'help', 'quake', 2, 'sent', false, true, true, 4, 'new', 'Kadıköy', 62, 58],
    [1047, 'help', 'fall', 4, 'sent', true, null, null, 1, 'new', 'Üsküdar', 55, 36],
    [1046, 'safe', null, 5, 'sent', false, null, null, 3, 'resolved', 'Beşiktaş', 40, 30],
    [1045, 'help', 'quake', 7, 'queued', false, true, null, 2, 'new', 'Esenyurt', 14, 62],
    [1044, 'help', 'crash', 9, 'sent', true, true, false, 2, 'dispatched', 'Bakırköy', 24, 74],
    [1043, 'help', 'fire', 11, 'sent', false, false, true, 5, 'dispatched', 'Fatih', 36, 46],
    [1042, 'safe', null, 12, 'sent', false, null, null, 1, 'resolved', 'Kadıköy', 66, 66],
    [1041, 'help', 'quake', 14, 'sent', false, true, true, 3, 'dispatched', 'Üsküdar', 58, 42],
    [1040, 'help', 'quake', 16, 'sending', false, null, null, 1, 'new', 'Maltepe', 78, 78],
    [1039, 'safe', null, 18, 'sent', false, null, null, 2, 'resolved', 'Şişli', 44, 24],
    [1038, 'help', 'fall', 21, 'sent', true, false, false, 1, 'resolved', 'Beşiktaş', 38, 34],
    [1037, 'help', 'quake', 23, 'queued', false, null, true, 6, 'new', 'Esenyurt', 10, 56],
    [1036, 'help', 'crash', 26, 'sent', true, true, null, 3, 'dispatched', 'Kartal', 86, 70],
    [1035, 'safe', null, 28, 'sent', false, null, null, 4, 'resolved', 'Fatih', 33, 50],
    [1034, 'help', 'quake', 31, 'sent', false, true, false, 2, 'resolved', 'Bakırköy', 27, 70],
    [1033, 'help', 'fire', 34, 'sent', false, false, false, 2, 'resolved', 'Kadıköy', 70, 62],
    [1032, 'safe', null, 37, 'sent', false, null, null, 1, 'resolved', 'Üsküdar', 52, 40],
    [1031, 'help', 'quake', 41, 'sent', false, true, true, 5, 'dispatched', 'Zeytinburnu', 30, 60],
    [1030, 'help', 'other', 44, 'sent', false, false, false, 1, 'resolved', 'Şişli', 47, 20],
    [1029, 'safe', null, 48, 'sent', false, null, null, 2, 'resolved', 'Maltepe', 74, 74],
    [1028, 'help', 'quake', 52, 'queued', false, true, null, 2, 'new', 'Avcılar', 8, 66],
    [1027, 'help', 'fall', 57, 'sent', true, null, null, 1, 'resolved', 'Fatih', 35, 44],
    [1026, 'safe', null, 63, 'sent', false, null, null, 3, 'resolved', 'Beşiktaş', 41, 28],
    [1025, 'help', 'crash', 70, 'sent', true, false, false, 2, 'resolved', 'Kartal', 84, 72]
  ].map(r => ({ id: r[0], kind: r[1], type: r[2], min: r[3], state: r[4], auto: r[5], injured: r[6], trapped: r[7], people: r[8], ops: r[9], district: r[10], x: r[11], y: r[12] }));

  // [need, urgency 1..3, meters, district, x, y]
  const N = [
    ['water', 3, 600, 'Esenyurt', 18, 58],
    ['aid', 3, 350, 'Kadıköy', 64, 54],
    ['shelter', 2, 1200, 'Fatih', 32, 52],
    ['aid', 2, 900, 'Üsküdar', 60, 38],
    ['water', 1, 1500, 'Bakırköy', 22, 78],
    ['shelter', 1, 2100, 'Maltepe', 80, 82]
  ].map(n => ({ need: n[0], urgency: n[1], meters: n[2], district: n[3], x: n[4], y: n[5] }));

  // [need, minutesAgo, state, done, volunteer]
  const T = [
    ['aid', 6, 'sent', false, 'G-214'],
    ['water', 19, 'sent', false, 'G-087'],
    ['shelter', 33, 'queued', false, 'G-301'],
    ['aid', 47, 'sent', true, 'G-112'],
    ['water', 66, 'sent', true, 'G-056'],
    ['aid', 80, 'sent', true, 'G-190']
  ].map(t => ({ need: t[0], min: t[1], state: t[2], done: t[3], vol: t[4] }));

  // [number, name, meters, minutes, capacity, occupied, x, y]
  const A = [
    [1, 'Moda Parkı', 350, 5, 1200, 840, 66, 60],
    [2, 'Fenerbahçe Stadı', 900, 12, 3000, 3000, 62, 70],
    [3, 'Yenikapı Meydanı', 600, 8, 2500, 1650, 31, 56],
    [4, 'Validebağ Korusu', 750, 10, 1500, 1320, 56, 34],
    [5, 'Florya Sahili', 1100, 15, 2000, 410, 18, 76],
    [6, 'Esenyurt Spor Salonu', 450, 6, 800, 790, 12, 60]
  ].map(a => ({ number: a[0], name: a[1], meters: a[2], minutes: a[3], capacity: a[4], occupied: a[5], x: a[6], y: a[7] }));

  // [id, type fire|rescue|sar|ems, name, status ready|busy|offline, units, phone, address, x, y, email]
  const C = [
    ['c1', 'ems', 'Kadıköy 112 Acil Ambulans İstasyonu', 'ready', 3, '+90 216 555 01 12', 'Bağdat Cd. No: 112, Kadıköy', 64, 60, 'kadikoy.112@ornek.org'],
    ['c2', 'ems', 'Fatih 112 Acil Ambulans İstasyonu', 'busy', 2, '+90 212 555 02 12', 'Millet Cd. No: 40, Fatih', 34, 48, 'fatih.112@ornek.org'],
    ['c3', 'ems', 'Bakırköy 112 Acil Ambulans İstasyonu', 'ready', 2, '+90 212 555 03 12', 'İncirli Cd. No: 8, Bakırköy', 26, 72, 'bakirkoy.112@ornek.org'],
    ['c4', 'fire', 'Kadıköy İtfaiye Grubu', 'ready', 4, '+90 216 555 01 10', 'Fikirtepe Mh., Kadıköy', 68, 56, 'kadikoy.itfaiye@ornek.org'],
    ['c5', 'fire', 'Esenyurt İtfaiye Grubu', 'ready', 3, '+90 212 555 05 10', 'Merkez Mh., Esenyurt', 12, 58, 'esenyurt.itfaiye@ornek.org'],
    ['c6', 'fire', 'Üsküdar İtfaiye Grubu', 'busy', 3, '+90 216 555 06 10', 'Altunizade Mh., Üsküdar', 54, 38, 'uskudar.itfaiye@ornek.org'],
    ['c7', 'rescue', 'AFAD Kurtarma Ekibi, Anadolu', 'ready', 2, '+90 216 555 07 22', 'Kozyatağı Mh., Kadıköy', 72, 64, 'afad.anadolu@ornek.org'],
    ['c8', 'rescue', 'AFAD Kurtarma Ekibi, Avrupa', 'ready', 2, '+90 212 555 08 22', 'Yenikapı Mh., Fatih', 28, 54, 'afad.avrupa@ornek.org'],
    ['c9', 'sar', 'Arama Kurtarma Birimi, Beşiktaş', 'ready', 1, '+90 212 555 09 33', 'Barbaros Blv., Beşiktaş', 42, 32, 'ak.besiktas@ornek.org'],
    ['c10', 'sar', 'Arama Kurtarma Birimi, Maltepe', 'offline', 1, '+90 216 555 10 33', 'Cevizli Mh., Maltepe', 78, 80, 'ak.maltepe@ornek.org']
  ].map(c => ({ id: c[0], type: c[1], name: c[2], status: c[3], units: c[4], phone: c[5], address: c[6], x: c[7], y: c[8], email: c[9], active: true }));

  // Assignments live on the report: s = notified|accepted|enroute|arrived|done|declined, min = minutes since assigned.
  const AS = {
    1044: [['c3', 'arrived', 8], ['c4', 'enroute', 8]],
    1043: [['c4', 'accepted', 10]],
    1041: [['c7', 'enroute', 13], ['c1', 'notified', 2]],
    1036: [['c1', 'done', 24], ['c4', 'arrived', 25]],
    1031: [['c8', 'accepted', 40], ['c2', 'notified', 39], ['c1', 'accepted', 12]],
    1034: [['c1', 'done', 30], ['c8', 'done', 30]]
  };
  R.forEach(r => { r.assign = (AS[r.id] || []).map(a => ({ c: a[0], s: a[1], min: a[2], seen: a[1] !== 'notified' })); });

  const hourly = [3, 2, 4, 6, 5, 9, 14, 22, 31, 27, 18, 12];
  const roles = { aid: 19, rescue: 12, logistics: 16 };
  return { reports: R, needs: N, tasks: T, areas: A, centers: C, hourly, roles, volunteersActive: 47 };
})();
