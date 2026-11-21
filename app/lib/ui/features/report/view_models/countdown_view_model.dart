import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../../../data/repositories/reports_repository.dart';
import '../../../../domain/models/models.dart';

enum CountdownEnd { cancelled, sentNow, sentAuto, sendFailed }

/// The 60 second safety countdown that opens when a sensor detects a shake, crash or fall.
/// Cancelling is the safe answer; if nobody answers, the help report is sent automatically.
class CountdownViewModel extends ChangeNotifier {
  CountdownViewModel(this._reports, {this.totalSeconds = 60});

  final ReportsRepository _reports;
  final int totalSeconds;

  CountdownCause? _cause;
  int _remaining = 0;
  int _speed = 1;
  Timer? _timer;
  String _returnTo = '/home';

  /// Set when the countdown ends, read once by the navigator.
  CountdownEnd? _end;
  Report? _sentReport;

  bool get active => _cause != null;
  CountdownCause? get cause => _cause;
  int get remaining => _remaining;
  int get speed => _speed;
  String get returnTo => _returnTo;
  CountdownEnd? get end => _end;

  /// Reads and clears how the last countdown ended, so the navigator reacts exactly once.
  CountdownEnd? takeEnd() {
    final e = _end;
    _end = null;
    return e;
  }

  Report? get sentReport => _sentReport;

  /// Starts the countdown. Returns false when automatic detection is switched off or one is already running.
  bool start(
    CountdownCause cause, {
    required bool autoDetectEnabled,
    String returnTo = '/home',
  }) {
    if (!autoDetectEnabled || active) return false;
    _cause = cause;
    _remaining = totalSeconds;
    _returnTo = returnTo;
    _end = null;
    _sentReport = null;
    _restartTimer();
    notifyListeners();
    return true;
  }

  void setSpeed(int speed) {
    _speed = speed;
    if (active) _restartTimer();
    notifyListeners();
  }

  void cancel() => unawaited(_finish(CountdownEnd.cancelled));

  void sendNow() => unawaited(_finish(CountdownEnd.sentNow));

  void _tick() {
    if (!active) return;
    _remaining -= 1;
    if (_remaining <= 0) {
      unawaited(_finish(CountdownEnd.sentAuto));
    } else {
      notifyListeners();
    }
  }

  Future<void> _finish(CountdownEnd end) async {
    final cause = _cause;
    if (cause == null) return;
    _timer?.cancel();
    _timer = null;
    _cause = null;
    _remaining = 0;
    _sentReport = null;
    if (end != CountdownEnd.cancelled) {
      try {
        _sentReport = await _reports.create(
          kind: ReportKind.help,
          type: switch (cause) {
            CountdownCause.quake => IncidentType.quake,
            CountdownCause.crash => IncidentType.crash,
            CountdownCause.fall => IncidentType.fall,
          },
          auto: end == CountdownEnd.sentAuto,
        );
      } on Exception catch (error) {
        debugPrint('Failed to save countdown report locally: $error');
        end = CountdownEnd.sendFailed;
      }
    }
    _end = end;
    notifyListeners();
  }

  void _restartTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(
      Duration(milliseconds: 1000 ~/ _speed),
      (_) => _tick(),
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
