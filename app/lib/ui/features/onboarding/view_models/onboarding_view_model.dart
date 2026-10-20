import 'package:flutter/foundation.dart';

enum Permission { location, notifications, sensors }

/// Step 1: language. Step 2: permissions and the KVKK consent (consent is required to continue).
class OnboardingViewModel extends ChangeNotifier {
  int _step = 1;
  bool _kvkk = false;
  bool _kvkkError = false;
  final Map<Permission, bool> _permissions = {
    for (final p in Permission.values) p: false,
  };

  int get step => _step;
  bool get kvkk => _kvkk;
  bool get kvkkError => _kvkkError;
  bool isGranted(Permission p) => _permissions[p] ?? false;

  void next() {
    _step = 2;
    notifyListeners();
  }

  void back() {
    _step = 1;
    notifyListeners();
  }

  void togglePermission(Permission p) {
    _permissions[p] = !isGranted(p);
    notifyListeners();
  }

  void setKvkk(bool value) {
    _kvkk = value;
    if (value) _kvkkError = false;
    notifyListeners();
  }

  /// Returns true when the user may continue; otherwise the consent error is shown under the checkbox.
  bool finish() {
    if (!_kvkk) {
      _kvkkError = true;
      notifyListeners();
      return false;
    }
    return true;
  }
}
