import 'package:flutter/foundation.dart';
import '../../domain/models/models.dart';

abstract class ConnectivityRepository extends ChangeNotifier {
  NetworkStatus get status;
  // تمت إضافة الدالة هنا ليتعرف عليها التطبيق
  void setStatus(NetworkStatus newStatus); 
}

class FakeConnectivityRepository extends ConnectivityRepository {
  NetworkStatus _status = NetworkStatus.online;

  @override
  NetworkStatus get status => _status;

  @override
  void setStatus(NetworkStatus newStatus) {
    _status = newStatus;
    notifyListeners();
  }
}