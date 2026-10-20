import 'package:flutter/foundation.dart';

/// Siren and SOS flash. The real audio/flash come from platform plugins later; state only for now.
class ToolsViewModel extends ChangeNotifier {
  bool _siren = false;
  bool _flash = false;

  bool get siren => _siren;
  bool get flash => _flash;

  void toggleSiren() {
    _siren = !_siren;
    notifyListeners();
  }

  void toggleFlash() {
    _flash = !_flash;
    notifyListeners();
  }
}
