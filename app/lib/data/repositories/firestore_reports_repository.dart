import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';

import '../../domain/models/models.dart';
import 'location_repository.dart';
import 'reports_repository.dart';

/// How a failed write should be shown: [offline] = the server cannot be reached (the report waits on the
/// device and is sent later); [rejected] = the server answered but refused (rules, sign-in disabled, ...).
enum WriteFailure { offline, rejected }

/// Classifies a Firebase error code. Network-type codes mean offline; everything else is a refusal that
/// must not be disguised as "no internet".
WriteFailure classifyFailureCode(String code) => switch (code) {
  'unavailable' ||
  'deadline-exceeded' ||
  'cancelled' ||
  'network-request-failed' => WriteFailure.offline,
  _ => WriteFailure.rejected,
};

String _codeOf(Object e) => e is FirebaseException ? e.code : e.runtimeType.toString();

/// Reports stored in Cloud Firestore (collection `reports`), read by the operations dashboard.
///
/// The app signs in anonymously; the rules let that user create a well-formed report and, while the
/// operators have not touched it (`ops == 'new'`), fill in the optional details or take it back.
/// A report made offline is kept by the Firestore SDK and sent when the network returns: it shows as
/// `queued` when the server has not acknowledged it after [queueAfter], then flips to `sent`.
class FirestoreReportsRepository extends ChangeNotifier
    implements ReportsRepository {
  FirestoreReportsRepository({
    required this.location,
    FirebaseFirestore? firestore,
    FirebaseAuth? auth,
    this.queueAfter = const Duration(seconds: 3),
    this.retryEvery = const Duration(seconds: 8),
    this.maxAttempts = 20,
  }) : _db = firestore ?? FirebaseFirestore.instance,
       _auth = auth ?? FirebaseAuth.instance {
    unawaited(_signedIn());
  }

  final LocationRepository location;
  final FirebaseFirestore _db;
  final FirebaseAuth _auth;
  final Duration queueAfter;
  final Duration retryEvery;
  final int maxAttempts;

  final List<Report> _reports = [];
  final Map<int, DocumentReference<Map<String, dynamic>>> _refs = {};
  /// Completes when the document write has been handed to the SDK (not when the server acknowledged it),
  /// so that update/remove always come after it.
  final Map<int, Future<void>> _handedOver = {};
  final Set<int> _removed = {};
  int _seq = 0;
  int _flushed = 0;

  CollectionReference<Map<String, dynamic>> get _col =>
      _db.collection('reports');

  @override
  List<Report> get reports => List.unmodifiable(_reports);

  @override
  Report? byId(int id) {
    for (final r in _reports) {
      if (r.id == id) return r;
    }
    return null;
  }

  @override
  int get queuedCount =>
      _reports.where((r) => r.state == DeliveryState.queued).length;

  /// Anonymous sign-in, retried until it works (the first launch can be offline). [onError] gets each failure's code.
  Future<User> _signedIn({void Function(String code)? onError}) async {
    while (true) {
      final user = _auth.currentUser;
      if (user != null) return user;
      try {
        return (await _auth.signInAnonymously()).user!;
      } catch (e) {
        debugPrint('anonymous sign-in failed: $e');
        onError?.call(_codeOf(e));
        await Future<void>.delayed(retryEvery);
      }
    }
  }

  /// Records (or clears) why the server has not taken the report, and tells the screens.
  void _setProblem(Report report, String? code) {
    final problem = code != null && classifyFailureCode(code) == WriteFailure.rejected
        ? code
        : null;
    if (report.problem == problem) return;
    report.problem = problem;
    notifyListeners();
  }

  @override
  Report create({
    required ReportKind kind,
    IncidentType? type,
    bool auto = false,
  }) {
    final report = Report(
      id: ++_seq,
      kind: kind,
      type: type,
      auto: auto,
      time: DateFormat('HH:mm').format(DateTime.now()),
      state: DeliveryState.sending,
      locating: true,
    );
    _reports.add(report);
    final ref = _col.doc();
    _refs[report.id] = ref;

    // Not acknowledged in time: it is on the device and will be sent later.
    Timer(queueAfter, () {
      if (report.state != DeliveryState.sending) return;
      report.state = DeliveryState.queued;
      notifyListeners();
    });

    final handedOver = Completer<void>();
    _handedOver[report.id] = handedOver.future;
    unawaited(_send(report, ref, handedOver));
    notifyListeners();
    return report;
  }

  Future<void> _send(
    Report report,
    DocumentReference<Map<String, dynamic>> ref,
    Completer<void> handedOver,
  ) async {
    final user = await _signedIn(onError: (code) => _setProblem(report, code));
    _setProblem(report, null);
    final pos = await location.current();
    report
      ..lat = pos.lat
      ..lng = pos.lng
      ..fromGps = pos.fromGps
      ..locating = false;
    notifyListeners();
    final no = 10000 + (DateTime.now().millisecondsSinceEpoch ~/ 1000) % 90000;
    for (var attempt = 1; attempt <= maxAttempts; attempt++) {
      if (_removed.contains(report.id)) break;
      final write = ref.set({
        'no': no,
        'kind': report.kind.name,
        'type': report.type?.name,
        'auto': report.auto,
        'state': 'sent',
        'injured': report.injured,
        'trapped': report.trapped,
        'people': report.people,
        'lat': pos.lat,
        'lng': pos.lng,
        'deviceId': user.uid,
        'uid': user.uid,
        'ops': 'new',
        'createdAt': FieldValue.serverTimestamp(),
      });
      if (!handedOver.isCompleted) handedOver.complete();
      try {
        await write; // only completes once the server has it
        if (_removed.contains(report.id)) return;
        if (report.state == DeliveryState.queued) _flushed++;
        report.state = DeliveryState.sent;
        report.problem = null;
        notifyListeners();
        return;
      } catch (e) {
        debugPrint('report write failed (attempt $attempt): $e');
        _setProblem(report, _codeOf(e));
        if (report.state == DeliveryState.sending) {
          report.state = DeliveryState.queued;
          notifyListeners();
        }
        await Future<void>.delayed(retryEvery);
      }
    }
    if (!handedOver.isCompleted) handedOver.complete();
  }

  @override
  void remove(int id) {
    _reports.removeWhere((r) => r.id == id);
    _removed.add(id);
    final ref = _refs[id];
    final ready = _handedOver[id];
    if (ref != null && ready != null) {
      unawaited(
        ready.then((_) => ref.delete()).catchError((Object e) {
          debugPrint('report delete failed: $e');
        }),
      );
    }
    notifyListeners();
  }

  @override
  void update(
    int id, {
    bool? injured,
    bool? trapped,
    int? people,
    bool clearInjured = false,
    bool clearTrapped = false,
  }) {
    final r = byId(id);
    if (r == null) return;
    if (injured != null || clearInjured) r.injured = injured;
    if (trapped != null || clearTrapped) r.trapped = trapped;
    if (people != null) r.people = people.clamp(1, 99);
    notifyListeners();

    final ref = _refs[id];
    final ready = _handedOver[id];
    if (ref == null || ready == null) return;
    final fields = <String, Object?>{
      if (injured != null || clearInjured) 'injured': r.injured,
      if (trapped != null || clearTrapped) 'trapped': r.trapped,
      if (people != null) 'people': r.people,
    };
    unawaited(
      ready.then((_) => ref.update(fields)).catchError((Object e) {
        debugPrint('report update failed: $e');
      }),
    );
  }

  @override
  int takeFlushedCount() {
    final n = _flushed;
    _flushed = 0;
    return n;
  }
}
