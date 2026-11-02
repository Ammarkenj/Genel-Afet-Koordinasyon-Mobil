import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';

import '../../domain/models/models.dart';
import 'reports_repository.dart';

class ReportCoordinates {
  const ReportCoordinates(this.latitude, this.longitude);

  final double latitude;
  final double longitude;
}

abstract interface class ReportLocationProvider {
  Future<ReportCoordinates> currentLocation();
}

class ReportLocationException implements Exception {
  const ReportLocationException();
}

class GeolocatorReportLocationProvider implements ReportLocationProvider {
  @override
  Future<ReportCoordinates> currentLocation() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        throw const ReportLocationException();
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        throw const ReportLocationException();
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );
      return ReportCoordinates(position.latitude, position.longitude);
    } on ReportLocationException {
      rethrow;
    } on LocationServiceDisabledException {
      throw const ReportLocationException();
    } on PermissionDeniedException {
      throw const ReportLocationException();
    } on TimeoutException {
      throw const ReportLocationException();
    } on PlatformException {
      throw const ReportLocationException();
    }
  }
}

class ApiReportsRepository extends ChangeNotifier
    implements ReportsRepository {
  ApiReportsRepository({
    required this.apiBaseUrl,
    required this.locationProvider,
    http.Client? client,
  }) : _client = client ?? http.Client(),
       _ownsClient = client == null;

  final Uri apiBaseUrl;
  final ReportLocationProvider locationProvider;
  final http.Client _client;
  final bool _ownsClient;
  final List<Report> _reports = [];
  int _nextId = 0;
  bool _disposed = false;

  @override
  List<Report> get reports => List.unmodifiable(_reports);

  @override
  Report? byId(int id) {
    for (final report in _reports) {
      if (report.id == id) return report;
    }
    return null;
  }

  @override
  int get queuedCount => 0;

  @override
  Report create({
    required ReportKind kind,
    IncidentType? type,
    bool auto = false,
  }) {
    final occurredAt = DateTime.now();
    final report = Report(
      id: ++_nextId,
      kind: kind,
      type: type,
      auto: auto,
      time: DateFormat('HH:mm').format(occurredAt),
      state: kind == ReportKind.help
          ? ReportDeliveryState.sending
          : ReportDeliveryState.localOnly,
      clientReportId: kind == ReportKind.help ? _newClientReportId() : null,
      occurredAt: occurredAt.toUtc(),
    );
    _reports.add(report);
    if (!_disposed) notifyListeners();

    if (kind == ReportKind.help) {
      unawaited(_deliver(report));
    }
    return report;
  }

  @override
  void remove(int id) {
    final report = byId(id);
    if (report == null || !report.canUndo) return;
    _reports.remove(report);
    if (!_disposed) notifyListeners();
  }

  @override
  void retry(int id) {
    final report = byId(id);
    if (report == null || report.state != ReportDeliveryState.failed) return;
    report.state = ReportDeliveryState.sending;
    report.deliveryFailure = null;
    notifyListeners();
    unawaited(_deliver(report));
  }

  @override
  void update(
    int id, {
    bool? injured,
    bool? trapped,
    int? people,
    bool clearInjured = false,
    bool clearTrapped = false,
  }) {
    final report = byId(id);
    if (report == null) return;
    if (injured != null || clearInjured) report.injured = injured;
    if (trapped != null || clearTrapped) report.trapped = trapped;
    if (people != null) report.people = people.clamp(1, 99);
    notifyListeners();
  }

  @override
  int takeFlushedCount() => 0;

  Future<void> _deliver(Report report) async {
    try {
      final location = report.latitude != null && report.longitude != null
          ? ReportCoordinates(report.latitude!, report.longitude!)
          : await locationProvider.currentLocation();
      if (_disposed || !_reports.contains(report)) return;
      report.latitude = location.latitude;
      report.longitude = location.longitude;
      report.canUndo = false;
      if (!_disposed) notifyListeners();

      final response = await _client
          .post(
            apiBaseUrl.resolve('/api/v1/reports'),
            headers: const {'content-type': 'application/json'},
            body: jsonEncode({
              'clientReportId': report.clientReportId,
              'type': _apiType(report.type),
              'occurredAt': report.occurredAt.toIso8601String(),
              'location': {
                'latitude': location.latitude,
                'longitude': location.longitude,
              },
            }),
          )
          .timeout(const Duration(seconds: 20));

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw const _ApiReportException();
      }

      final body = jsonDecode(response.body);
      if (body is! Map<String, dynamic> ||
          body['data'] is! Map<String, dynamic> ||
          body['data']['id'] is! String) {
        throw const _ApiReportException();
      }

      report.serverReportId = body['data']['id'] as String;
      report.state = ReportDeliveryState.sent;
      report.deliveryFailure = null;
    } on ReportLocationException {
      report.state = ReportDeliveryState.failed;
      report.deliveryFailure = ReportDeliveryFailure.location;
    } on TimeoutException {
      report.state = ReportDeliveryState.failed;
      report.deliveryFailure = ReportDeliveryFailure.connection;
    } on http.ClientException {
      report.state = ReportDeliveryState.failed;
      report.deliveryFailure = ReportDeliveryFailure.connection;
    } on FormatException {
      report.state = ReportDeliveryState.failed;
      report.deliveryFailure = ReportDeliveryFailure.server;
    } on _ApiReportException {
      report.state = ReportDeliveryState.failed;
      report.deliveryFailure = ReportDeliveryFailure.server;
    } on Exception catch (error) {
      debugPrint('Guest report delivery failed (${error.runtimeType}).');
      report.state = ReportDeliveryState.failed;
      report.deliveryFailure = ReportDeliveryFailure.server;
    }

    if (!_disposed) notifyListeners();
  }

  String _newClientReportId() {
    final random = Random.secure();
    final suffix = List.generate(
      4,
      (_) => random.nextInt(1 << 32).toRadixString(16).padLeft(8, '0'),
    ).join();
    return 'guest-${DateTime.now().microsecondsSinceEpoch}-$suffix';
  }

  String _apiType(IncidentType? type) => switch (type) {
    IncidentType.quake => 'earthquake',
    IncidentType.crash => 'accident',
    IncidentType.fall => 'fall',
    IncidentType.fire => 'fire',
    IncidentType.other || null => 'help',
  };

  @override
  void dispose() {
    _disposed = true;
    if (_ownsClient) _client.close();
    super.dispose();
  }
}

class _ApiReportException implements Exception {
  const _ApiReportException();
}
