import 'package:flutter/foundation.dart';

import '../../domain/models/models.dart';
import 'connectivity_repository.dart';

abstract class VolunteerRepository extends ChangeNotifier {
  int takeFlushedCount();
  bool get isDemo;
  bool get hasLoaded;
  VolunteerRole get role;
  bool get hasCertificate;
  bool get joined;
  bool get available;
  List<VolunteerNeed> get needs;
  VolunteerTask? get task;

  Future<void> refresh();
  Future<void> register({
    required VolunteerRole role,
    required bool hasCertificate,
  });
  Future<void> setAvailable(bool available);
  Future<bool> accept(NeedId needId, {String? recordId});
  Future<void> complete();
}

class VolunteerApiException implements Exception {
  const VolunteerApiException(this.code, {this.statusCode});

  final String code;
  final int? statusCode;
}

class FakeVolunteerRepository extends VolunteerRepository {
  FakeVolunteerRepository(this.connectivity) {
    connectivity.addListener(_onConnectivityChanged);
  }

  final FakeConnectivityRepository connectivity;
  final List<VolunteerNeed> _needs = const [
    VolunteerNeed(
      id: NeedId.aid,
      urgency: 2,
      meters: 350,
      recordId: 'demo-aid',
    ),
    VolunteerNeed(
      id: NeedId.water,
      urgency: 1,
      meters: 600,
      recordId: 'demo-water',
    ),
    VolunteerNeed(
      id: NeedId.shelter,
      urgency: 3,
      meters: 1200,
      recordId: 'demo-shelter',
    ),
  ];

  VolunteerRole _role = VolunteerRole.rescue;
  bool _hasCertificate = false;
  bool _joined = false;
  bool _available = false;
  VolunteerTask? _task;
  int _flushedCount = 0;

  @override
  bool get isDemo => true;

  @override
  bool get hasLoaded => true;

  @override
  VolunteerRole get role => _role;

  @override
  bool get hasCertificate => _hasCertificate;

  @override
  bool get joined => _joined;

  @override
  bool get available => _available;

  @override
  List<VolunteerNeed> get needs => List.unmodifiable(_needs);

  @override
  VolunteerTask? get task => _task;

  @override
  int takeFlushedCount() {
    final count = _flushedCount;
    _flushedCount = 0;
    return count;
  }

  @override
  Future<void> refresh() async {}

  @override
  Future<void> register({
    required VolunteerRole role,
    required bool hasCertificate,
  }) async {
    _role = role;
    _hasCertificate = hasCertificate;
    _joined = true;
    _available = true;
    notifyListeners();
  }

  @override
  Future<void> setAvailable(bool available) async {
    _available = available;
    notifyListeners();
  }

  @override
  Future<bool> accept(NeedId needId, {String? recordId}) async {
    if (!_joined ||
        !_available ||
        (_task != null && !_task!.done)) {
      return false;
    }
    final matches = _needs.where((item) => item.id == needId);
    if (matches.isEmpty) return false;
    final need = matches.first;
    if (recordId != null && need.recordId != recordId) {
      return false;
    }
    final queued = connectivity.status == NetworkStatus.offline;
    _task = VolunteerTask(
      need: need.id,
      recordId: need.recordId,
      eventTitle: need.eventTitle,
      time: DateTime.now().toLocal().toString(),
      state: queued ? DeliveryState.queued : DeliveryState.sent,
    );
    notifyListeners();
    return true;
  }

  @override
  Future<void> complete() async {
    if (_task == null || _task!.done) return;
    _task!.done = true;
    notifyListeners();
  }

  void _onConnectivityChanged() {
    if (connectivity.status == NetworkStatus.online &&
        _task?.state == DeliveryState.queued) {
      _task!.state = DeliveryState.sent;
      _flushedCount++;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    connectivity.removeListener(_onConnectivityChanged);
    super.dispose();
  }
}
