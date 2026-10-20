import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';

import '../../domain/models/models.dart';
import 'connectivity_repository.dart';

/// Reports ("I need help" / "I am safe"). A report made offline is queued on the device and sent when the
/// network returns, exactly like the prototype's offline queue. In-memory here; Room/Drift + WorkManager later.
abstract class ReportsRepository implements Listenable {
  List<Report> get reports;
  Report? byId(int id);
  int get queuedCount;
  Report create({
    required ReportKind kind,
    IncidentType? type,
    bool auto = false,
  });
  void remove(int id);
  void update(
    int id, {
    bool? injured,
    bool? trapped,
    int? people,
    bool clearInjured,
    bool clearTrapped,
  });

  /// Number of queued reports that were sent by the last network change (for the toast).
  int takeFlushedCount();
}

class FakeReportsRepository extends ChangeNotifier
    implements ReportsRepository {
  FakeReportsRepository(
    this._net, {
    this.sendingDelay = const Duration(milliseconds: 2500),
  }) {
    _net.addListener(_onNetworkChanged);
  }

  final ConnectivityRepository _net;
  final Duration sendingDelay;
  final List<Report> _reports = [];
  int _seq = 0;
  int _flushed = 0;

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
      state: switch (_net.status) {
        NetworkStatus.offline => DeliveryState.queued,
        NetworkStatus.weak => DeliveryState.sending,
        NetworkStatus.online => DeliveryState.sent,
      },
    );
    _reports.add(report);
    if (report.state == DeliveryState.sending) {
      Timer(sendingDelay, () {
        if (report.state != DeliveryState.sending) return;
        report.state = _net.status == NetworkStatus.offline
            ? DeliveryState.queued
            : DeliveryState.sent;
        notifyListeners();
      });
    }
    notifyListeners();
    return report;
  }

  @override
  void remove(int id) {
    _reports.removeWhere((r) => r.id == id);
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
  }

  void _onNetworkChanged() {
    final status = _net.status;
    var flushed = 0;
    for (final r in _reports) {
      if (status != NetworkStatus.offline && r.state == DeliveryState.queued) {
        r.state = DeliveryState.sent;
        flushed++;
      }
      if (status == NetworkStatus.offline && r.state == DeliveryState.sending) {
        r.state = DeliveryState.queued;
      }
    }
    _flushed += flushed;
    notifyListeners();
  }

  @override
  int takeFlushedCount() {
    final n = _flushed;
    _flushed = 0;
    return n;
  }

  @override
  void dispose() {
    _net.removeListener(_onNetworkChanged);
    super.dispose();
  }
}
