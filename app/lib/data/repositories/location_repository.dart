import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

/// Where a report is made. `fromGps` is false when the fixed fallback was used.
class DevicePosition {
  const DevicePosition(this.lat, this.lng, {required this.fromGps});

  final double lat;
  final double lng;
  final bool fromGps;
}

/// Gives a report its coordinates. Never throws and never waits long: a report must not be lost because
/// the permission was refused or the GPS has no fix.
abstract class LocationRepository {
  Future<DevicePosition> current();
}

/// Fixed test position (Elazığ), used when there is no GPS.
const DevicePosition fallbackPosition = DevicePosition(
  38.6748,
  39.2225,
  fromGps: false,
);

class GeolocatorLocationRepository implements LocationRepository {
  GeolocatorLocationRepository({
    this.fixTimeout = const Duration(seconds: 4),
    this.maxWait = const Duration(seconds: 8),
    this.freshFor = const Duration(minutes: 1),
  });

  final Duration fixTimeout;
  final Duration maxWait;
  final Duration freshFor;

  DevicePosition? _last;
  DateTime? _lastAt;

  /// Asks for the permission and gets a first fix early, so the first report does not wait for the dialog.
  void warmUp() => unawaited(current());

  @override
  Future<DevicePosition> current() async {
    final at = _lastAt;
    if (_last != null && at != null && DateTime.now().difference(at) < freshFor) {
      return _last!;
    }
    try {
      return await _read().timeout(maxWait);
    } catch (e) {
      debugPrint('location: $e');
      return _last ?? fallbackPosition;
    }
  }

  Future<DevicePosition> _read() async {
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      return _last ?? fallbackPosition;
    }
    if (!await Geolocator.isLocationServiceEnabled()) {
      return _last ?? fallbackPosition;
    }
    Position p;
    try {
      p = await Geolocator.getCurrentPosition(
        locationSettings: LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: fixTimeout,
        ),
      );
    } on TimeoutException {
      final known = await Geolocator.getLastKnownPosition();
      if (known == null) return _last ?? fallbackPosition;
      p = known;
    }
    final pos = DevicePosition(p.latitude, p.longitude, fromGps: true);
    _last = pos;
    _lastAt = DateTime.now();
    return pos;
  }
}
