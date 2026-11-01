import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';

import '../../domain/models/models.dart';
import 'connectivity_repository.dart';

/// Repository interface for reports sent to the backend or simulated in tests.
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
  void retry(int id);
  void dispose();
  void update(
    int id, {
    bool? injured,
    bool? trapped,
    int? people,
    bool clearInjured,
    bool clearTrapped,
  });

    /// Number of queued reports sent by the last network change (for the toast).
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
      _reports.where((r) => r.state == ReportDeliveryState.queued).length;

  @override
  Report create({
    required ReportKind kind,
    IncidentType? type,
    bool auto = false,
  }) {
    final occurredAt = DateTime.now();
    final report = Report(
      id: ++_seq,
      kind: kind,
      type: type,
      auto: auto,
      time: DateFormat('HH:mm').format(occurredAt),
      state: switch (_net.status) {
        NetworkStatus.offline => ReportDeliveryState.queued,
        NetworkStatus.weak => ReportDeliveryState.sending,
        NetworkStatus.online => ReportDeliveryState.sent,
      },
      occurredAt: occurredAt.toUtc(),
    );
    _reports.add(report);
    if (report.state == ReportDeliveryState.sending) {
      Timer(sendingDelay, () {
        if (report.state != ReportDeliveryState.sending) return;
        report.state = _net.status == NetworkStatus.offline
            ? ReportDeliveryState.queued
            : ReportDeliveryState.sent;
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
  void retry(int id) {}

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
      if (status != NetworkStatus.offline &&
          r.state == ReportDeliveryState.queued) {
        r.state = ReportDeliveryState.sent;
        flushed++;
      }
      if (status == NetworkStatus.offline &&
          r.state == ReportDeliveryState.sending) {
        r.state = ReportDeliveryState.queued;
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
