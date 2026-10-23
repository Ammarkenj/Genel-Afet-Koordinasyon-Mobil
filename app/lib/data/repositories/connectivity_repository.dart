import 'package:flutter/foundation.dart';

import '../../domain/models/models.dart';

/// Network state. The real implementation will read the platform connectivity; this one is driven by the lab panel.
abstract class ConnectivityRepository implements Listenable {
  NetworkStatus get status;
  void setStatus(NetworkStatus status);
}

class FakeConnectivityRepository extends ChangeNotifier
    implements ConnectivityRepository {
  NetworkStatus _status = NetworkStatus.online;

  @override
  NetworkStatus get status => _status;

  @override
  void setStatus(NetworkStatus status) {
    if (status == _status) return;
    _status = status;
    notifyListeners();
  }
}
