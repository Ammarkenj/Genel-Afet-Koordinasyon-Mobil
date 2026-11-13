import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

import '../../domain/models/models.dart';
import 'connectivity_repository.dart';

/// Reads the device's real network state (online / offline). A weak signal cannot be told apart here, so it is
/// never reported; the lab simulator still drives [FakeConnectivityRepository] in tests and visual review.
class RealConnectivityRepository extends ChangeNotifier
    implements ConnectivityRepository {
  RealConnectivityRepository({Connectivity? connectivity})
    : _connectivity = connectivity ?? Connectivity() {
    unawaited(_connectivity.checkConnectivity().then(_apply, onError: (_) {}));
    _sub = _connectivity.onConnectivityChanged.listen(_apply, onError: (_) {});
  }

  final Connectivity _connectivity;
  StreamSubscription<List<ConnectivityResult>>? _sub;
  NetworkStatus _status = NetworkStatus.online;

  @override
  NetworkStatus get status => _status;

  void _apply(List<ConnectivityResult> results) {
    final next =
        results.isEmpty || results.every((r) => r == ConnectivityResult.none)
        ? NetworkStatus.offline
        : NetworkStatus.online;
    if (next == _status) return;
    _status = next;
    notifyListeners();
  }

  /// The real state wins; the simulator's value is ignored.
  @override
  void setStatus(NetworkStatus status) {}

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
