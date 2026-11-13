import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';
import 'package:torch_light/torch_light.dart';
import 'package:volume_controller/volume_controller.dart';

/// The phone's siren (speaker) and flashlight. Failures never throw: a phone without a flash simply has none.
abstract class ToolsHardware {
  Future<void> startSiren();
  Future<void> stopSiren();

  /// Turns the flashlight on or off. Returns false when the phone has no flash or it cannot be used.
  Future<bool> setTorch(bool on);
}

/// Does nothing: tests, visual review and the web build.
class NoopToolsHardware implements ToolsHardware {
  @override
  Future<void> startSiren() async {}

  @override
  Future<void> stopSiren() async {}

  @override
  Future<bool> setTorch(bool on) async => true;
}

/// The real siren (a bundled looping wail, plays with no internet) and the camera flash.
class PlatformToolsHardware implements ToolsHardware {
  final AudioPlayer _player = AudioPlayer();
  bool _ready = false;

  /// The phone's media volume before the siren raised it, to put it back afterwards (null = not raised).
  double? _savedVolume;

  /// A siren nobody can hear is useless: the media volume goes to maximum while it runs and is restored when it stops.
  Future<void> _raiseVolume() async {
    try {
      final volume = VolumeController.instance;
      volume.showSystemUI = false;
      _savedVolume ??= await volume.getVolume();
      await volume.setVolume(1);
    } catch (e) {
      debugPrint('volume: $e');
    }
  }

  Future<void> _restoreVolume() async {
    final saved = _savedVolume;
    if (saved == null) return;
    _savedVolume = null;
    try {
      await VolumeController.instance.setVolume(saved);
    } catch (e) {
      debugPrint('volume restore: $e');
    }
  }

  @override
  Future<void> startSiren() async {
    try {
      await _raiseVolume();
      if (!_ready) {
        await _player.setReleaseMode(ReleaseMode.loop);
        await _player.setVolume(1);
        _ready = true;
      }
      await _player.play(AssetSource('audio/siren.wav'));
    } catch (e) {
      debugPrint('siren: $e');
    }
  }

  @override
  Future<void> stopSiren() async {
    try {
      await _player.stop();
    } catch (e) {
      debugPrint('siren stop: $e');
    }
    await _restoreVolume();
  }

  @override
  Future<bool> setTorch(bool on) async {
    try {
      if (on) {
        await TorchLight.enableTorch();
      } else {
        await TorchLight.disableTorch();
      }
      return true;
    } catch (e) {
      debugPrint('torch: $e');
      return false;
    }
  }
}
