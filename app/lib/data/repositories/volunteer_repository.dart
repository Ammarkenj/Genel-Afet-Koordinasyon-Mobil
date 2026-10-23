import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';

import '../../domain/models/models.dart';
import 'connectivity_repository.dart';

/// Volunteer registration, availability and the accepted task. Fields mirror Volunteers, Needs and
/// VolunteerAssignments in the ER diagram. Sample data; an accepted task follows the same offline queue as reports.
abstract class VolunteerRepository implements Listenable {
  bool get joined;
  VolunteerRole get role;
  bool get hasCertificate;
  bool get available;
  List<VolunteerNeed> get needs;
  VolunteerTask? get task;
  int takeFlushedCount();

  void register({required VolunteerRole role, required bool hasCertificate});
  void setAvailable(bool value);

  /// Returns false when another task is still active.
  bool accept(NeedId need);
  void complete();
}

class FakeVolunteerRepository extends ChangeNotifier
    implements VolunteerRepository {
  FakeVolunteerRepository(
    this._net, {
    this.sendingDelay = const Duration(milliseconds: 2500),
  }) {
    _net.addListener(_onNetworkChanged);
  }

  final ConnectivityRepository _net;
  final Duration sendingDelay;

  bool _joined = false;
  VolunteerRole _role = VolunteerRole.aid;
  bool _cert = false;
  bool _available = true;
  VolunteerTask? _task;
  int _flushed = 0;

  @override
  bool get joined => _joined;
  @override
  VolunteerRole get role => _role;
  @override
  bool get hasCertificate => _cert;
  @override
  bool get available => _available;
  @override
  VolunteerTask? get task => _task;

  @override
  List<VolunteerNeed> get needs => const [
    VolunteerNeed(id: NeedId.aid, urgency: 3, meters: 350),
    VolunteerNeed(id: NeedId.water, urgency: 3, meters: 600),
    VolunteerNeed(id: NeedId.shelter, urgency: 2, meters: 1200),
  ];

  @override
  void register({required VolunteerRole role, required bool hasCertificate}) {
    _role = role;
    _cert = hasCertificate;
    _joined = true;
    notifyListeners();
  }

  @override
  void setAvailable(bool value) {
    _available = value;
    notifyListeners();
  }

  @override
  bool accept(NeedId need) {
    final current = _task;
    if (current != null && current.need == need) return true;
    if (current != null && !current.done) return false;
    final task = VolunteerTask(
      need: need,
      time: DateFormat('HH:mm').format(DateTime.now()),
      state: switch (_net.status) {
        NetworkStatus.offline => DeliveryState.queued,
        NetworkStatus.weak => DeliveryState.sending,
        NetworkStatus.online => DeliveryState.sent,
      },
    );
    _task = task;
    if (task.state == DeliveryState.sending) {
      Timer(sendingDelay, () {
        if (task.state != DeliveryState.sending) return;
        task.state = _net.status == NetworkStatus.offline
            ? DeliveryState.queued
            : DeliveryState.sent;
        notifyListeners();
      });
    }
    notifyListeners();
    return true;
  }

  @override
  void complete() {
    _task?.done = true;
    notifyListeners();
  }

  void _onNetworkChanged() {
    final task = _task;
    if (task != null) {
      if (_net.status != NetworkStatus.offline &&
          task.state == DeliveryState.queued) {
        task.state = DeliveryState.sent;
        _flushed++;
      }
      if (_net.status == NetworkStatus.offline &&
          task.state == DeliveryState.sending) {
        task.state = DeliveryState.queued;
      }
    }
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
