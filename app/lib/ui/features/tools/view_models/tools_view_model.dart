import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../../../data/tools_hardware.dart';

/// Siren and SOS flash. The siren loops until it is switched off; the flash blinks the international SOS signal
/// (three short, three long, three short, then a pause) until it is switched off.
class ToolsViewModel extends ChangeNotifier {
  ToolsViewModel([ToolsHardware? hardware])
    : _hardware = hardware ?? NoopToolsHardware();

  final ToolsHardware _hardware;
  bool _siren = false;
  bool _flash = false;
  int _flashRun = 0;

  bool get siren => _siren;
  bool get flash => _flash;

  /// SOS in Morse as light durations: 1 = on for a dot, 3 = on for a dash (units of [unit]); gaps are one unit.
  static const sos = [1, 1, 1, 3, 3, 3, 1, 1, 1];
  static const unit = Duration(milliseconds: 220);
  static const pause = Duration(milliseconds: 1500);

  void toggleSiren() {
    _siren = !_siren;
    unawaited(_siren ? _hardware.startSiren() : _hardware.stopSiren());
    notifyListeners();
  }

  void toggleFlash() {
    _flash = !_flash;
    notifyListeners();
    if (_flash) {
      unawaited(_blink(++_flashRun));
    } else {
      _flashRun++;
      unawaited(_hardware.setTorch(false));
    }
  }

  Future<void> _blink(int run) async {
    bool alive() => _flash && run == _flashRun;
    while (alive()) {
      for (var i = 0; i < sos.length && alive(); i++) {
        if (!await _hardware.setTorch(true)) {
          // No usable flash on this phone: leave the switch off instead of pretending.
          if (alive()) {
            _flash = false;
            notifyListeners();
          }
          return;
        }
        await Future<void>.delayed(unit * sos[i]);
        await _hardware.setTorch(false);
        await Future<void>.delayed(unit);
      }
      if (alive()) await Future<void>.delayed(pause);
    }
    await _hardware.setTorch(false);
  }

  @override
  void dispose() {
    _siren = false;
    _flash = false;
    _flashRun++;
    unawaited(_hardware.stopSiren());
    unawaited(_hardware.setTorch(false));
    super.dispose();
  }
}
