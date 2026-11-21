import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';

import '../../domain/models/models.dart';
import '../local/daos/report_dao.dart';
import 'connectivity_repository.dart';
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

class ApiReportsRepository extends ChangeNotifier implements ReportsRepository {
  ApiReportsRepository({
    required Uri apiBaseUrl,
    required ReportLocationProvider locationProvider,
    required ConnectivityRepository connectivity,
    ReportDao? reportDao,
    http.Client? client,
  }) : _apiBaseUrl = apiBaseUrl,
       _locationProvider = locationProvider,
       _connectivity = connectivity,
       _reportDao = reportDao ?? ReportDao(),
       _client = client ?? http.Client(),
       _ownsClient = client == null {
    _connectivity.addListener(_onNetworkChanged);
  }

  final Uri _apiBaseUrl;
  final ReportLocationProvider _locationProvider;
  final ConnectivityRepository _connectivity;
  final ReportDao _reportDao;
  final http.Client _client;
  final bool _ownsClient;
  final List<Report> _reports = [];
  Future<void>? _initialization;
  Timer? _retryTimer;
  Duration _retryDelay = const Duration(seconds: 10);
  bool _syncing = false;
  int _flushed = 0;
  bool _disposed = false;

  @override
  List<Report> get reports => List.unmodifiable(_reports);

  @override
  int get queuedCount => _reports
      .where((report) => report.state == ReportDeliveryState.queued)
      .length;

  @override
  Report? byId(int id) {
    for (final report in _reports) {
      if (report.id == id) return report;
    }
    return null;
  }

  @override
  Future<void> initialize() => _initialization ??= _restoreReports();

  Future<void> _restoreReports() async {
    final rows = await _reportDao.getReports();
    for (final row in rows) {
      final report = _reportFromRow(row);
      if (report.clientUpdateToken == null &&
          report.state != ReportDeliveryState.sent) {
        report.clientUpdateToken = _newClientUpdateToken();
        await _reportDao.updateReport(report.clientReportId!, {
          'client_update_token': report.clientUpdateToken,
        });
      }
      if (report.state == ReportDeliveryState.sending) {
        report.state = ReportDeliveryState.queued;
        await _saveState(report);
      }
      _reports.add(report);
    }

    if (_hasPendingWork) {
      Timer.run(() {
        if (!_disposed) unawaited(syncPending());
      });
    }
    if (!_disposed) notifyListeners();
  }

  @override
  Future<Report> create({
    required ReportKind kind,
    IncidentType? type,
    bool auto = false,
  }) async {
    await initialize();

    final now = DateTime.now();
    final occurredAt = now.toUtc();
    final clientReportId = _newClientReportId();
    final clientUpdateToken = _newClientUpdateToken();
    final rowId = await _reportDao.insertReport({
      'id': clientReportId,
      'kind': kind.name,
      'type': type?.name,
      'auto': auto ? 1 : 0,
      'latitude': null,
      'longitude': null,
      'client_report_id': clientReportId,
      'client_update_token': clientUpdateToken,
      'is_synced': 0,
      'delivery_state': ReportDeliveryState.queued.name,
      'details_revision': 0,
      'synced_details_revision': 0,
      'people': 1,
      'created_at': now.toUtc().toIso8601String(),
      'occurred_at': occurredAt.toIso8601String(),
    });

    final report = Report(
      id: rowId,
      kind: kind,
      type: type,
      auto: auto,
      time: DateFormat('HH:mm').format(now),
      state: ReportDeliveryState.queued,
      occurredAt: occurredAt,
      clientReportId: clientReportId,
      clientUpdateToken: clientUpdateToken,
    );
    _reports.add(report);
    notifyListeners();

    if (_connectivity.status == NetworkStatus.offline) {
      _scheduleRetry();
    } else {
      unawaited(syncPending());
    }
    return report;
  }

  @override
  Future<void> remove(int id) async {
    await initialize();
    final report = byId(id);
    if (report == null || !report.canUndo) return;

    final deleted = await _reportDao.deleteQueuedReport(report.clientReportId!);
    if (deleted == 0) return;
    _reports.remove(report);
    notifyListeners();
  }

  @override
  Future<void> retry(int id) async {
    await initialize();
    final report = byId(id);
    if (report == null || report.state != ReportDeliveryState.failed) return;

    report.state = ReportDeliveryState.queued;
    report.deliveryFailure = null;
    await _saveState(report);
    notifyListeners();
    await syncPending();
  }

  @override
  Future<void> update(
    int id, {
    bool? injured,
    bool? trapped,
    int? people,
    bool clearInjured = false,
    bool clearTrapped = false,
  }) async {
    await initialize();
    final report = byId(id);
    if (report == null) return;

    if (report.state == ReportDeliveryState.sent &&
        report.clientUpdateToken == null) {
      throw StateError('This report cannot be updated on the server.');
    }

    if (injured != null || clearInjured) report.injured = injured;
    if (trapped != null || clearTrapped) report.trapped = trapped;
    if (people != null) report.people = people.clamp(1, 99);
    report.detailsRevision++;
    await _reportDao.updateReport(report.clientReportId!, {
      'injured': _toSqlBool(report.injured),
      'trapped': _toSqlBool(report.trapped),
      'people': report.people,
      'details_revision': report.detailsRevision,
    });
    notifyListeners();

    if (report.state == ReportDeliveryState.sent) {
      unawaited(syncPending());
    }
  }

  @override
  Future<int> syncPending({bool force = false}) async {
    await initialize();
    if (_syncing || _disposed) return 0;
    _syncing = true;
    var sentCount = 0;

    try {
      if (!force && _connectivity.status == NetworkStatus.offline) return 0;

      for (final report in List<Report>.of(_reports)) {
        if (_disposed) break;
        if (report.state != ReportDeliveryState.sent) {
          if (report.state == ReportDeliveryState.failed &&
              report.deliveryFailure == ReportDeliveryFailure.location) {
            continue;
          }
          if (await _deliver(report)) sentCount++;
        } else if (report.detailsRevision > report.syncedDetailsRevision) {
          await _syncDetails(report);
        }
      }

      if (sentCount > 0) {
        _flushed += sentCount;
        notifyListeners();
      }
      if (_hasPendingWork) {
        _scheduleRetry();
      } else {
        _retryTimer?.cancel();
        _retryTimer = null;
        _retryDelay = const Duration(seconds: 10);
      }
      return sentCount;
    } finally {
      _syncing = false;
    }
  }

  Future<bool> _deliver(Report report) async {
    try {
      if (report.latitude == null || report.longitude == null) {
        final location = await _locationProvider.currentLocation();
        report.latitude = location.latitude;
        report.longitude = location.longitude;
        await _reportDao.updateReport(report.clientReportId!, {
          'latitude': report.latitude,
          'longitude': report.longitude,
        });
      }

      report.state = ReportDeliveryState.sending;
      report.deliveryFailure = null;
      report.canUndo = false;
      await _saveState(report);
      notifyListeners();

      final detailsRevision = report.detailsRevision;
      final response = await _client
          .post(
            _apiBaseUrl.resolve('/api/v1/reports'),
            headers: const {'content-type': 'application/json'},
            body: jsonEncode({
              'clientReportId': report.clientReportId,
              'clientUpdateToken': report.clientUpdateToken,
              'kind': report.kind.name,
              'type': _apiType(report.type),
              'auto': report.auto,
              'occurredAt': report.occurredAt.toIso8601String(),
              'location': {
                'latitude': report.latitude,
                'longitude': report.longitude,
              },
              'injured': report.injured,
              'trapped': report.trapped,
              'people': report.people,
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
      report.syncedDetailsRevision = detailsRevision;
      await _reportDao.markReportAsSynced(
        report.clientReportId!,
        serverReportId: report.serverReportId!,
        syncedDetailsRevision: detailsRevision,
      );
      _connectivity.setStatus(NetworkStatus.online);
      notifyListeners();

      if (report.detailsRevision > report.syncedDetailsRevision) {
        await _syncDetails(report);
      }
      return true;
    } on ReportLocationException {
      report.state = ReportDeliveryState.failed;
      report.deliveryFailure = ReportDeliveryFailure.location;
      await _saveState(report);
      notifyListeners();
      return false;
    } on TimeoutException {
      await _markDeliveryRetry(report, ReportDeliveryFailure.connection);
      return false;
    } on http.ClientException {
      await _markDeliveryRetry(report, ReportDeliveryFailure.connection);
      return false;
    } on FormatException {
      await _markDeliveryRetry(report, ReportDeliveryFailure.server);
      return false;
    } on _ApiReportException {
      await _markDeliveryRetry(report, ReportDeliveryFailure.server);
      return false;
    } on Exception catch (error) {
      debugPrint('Guest report delivery failed (${error.runtimeType}).');
      await _markDeliveryRetry(report, ReportDeliveryFailure.server);
      return false;
    }
  }

  Future<void> _syncDetails(Report report) async {
    final serverReportId = report.serverReportId;
    final clientUpdateToken = report.clientUpdateToken;
    if (serverReportId == null || clientUpdateToken == null) {
      throw StateError(
        'Report follow-up updates require a server ID and token.',
      );
    }

    while (report.detailsRevision > report.syncedDetailsRevision) {
      final detailsRevision = report.detailsRevision;
      try {
        final response = await _client
            .patch(
              _apiBaseUrl.resolve('/api/v1/reports/$serverReportId/details'),
              headers: const {'content-type': 'application/json'},
              body: jsonEncode({
                'clientUpdateToken': clientUpdateToken,
                'injured': report.injured,
                'trapped': report.trapped,
                'people': report.people,
              }),
            )
            .timeout(const Duration(seconds: 20));

        if (response.statusCode != 200) {
          throw const _ApiReportException();
        }
        report.syncedDetailsRevision = detailsRevision;
        await _reportDao.updateReport(report.clientReportId!, {
          'synced_details_revision': detailsRevision,
          'delivery_failure': null,
        });
      } on TimeoutException {
        await _markDeliveryRetry(report, ReportDeliveryFailure.connection);
        return;
      } on http.ClientException {
        await _markDeliveryRetry(report, ReportDeliveryFailure.connection);
        return;
      } on Exception catch (error) {
        debugPrint('Guest report detail sync failed (${error.runtimeType}).');
        await _markDeliveryRetry(report, ReportDeliveryFailure.server);
        return;
      }
    }
    notifyListeners();
  }

  Future<void> _markDeliveryRetry(
    Report report,
    ReportDeliveryFailure failure,
  ) async {
    report.state = report.serverReportId == null
        ? ReportDeliveryState.failed
        : ReportDeliveryState.sent;
    report.deliveryFailure = failure;
    await _saveState(report);
    if (failure == ReportDeliveryFailure.connection) {
      _connectivity.setStatus(NetworkStatus.offline);
    }
    notifyListeners();
  }

  Future<void> _saveState(Report report) =>
      _reportDao.updateReport(report.clientReportId!, {
        'delivery_state': report.state.name,
        'delivery_failure': report.deliveryFailure?.name,
        'can_undo': report.canUndo ? 1 : 0,
      });

  Report _reportFromRow(Map<String, Object?> row) {
    final kind = ReportKind.values.byName(row['kind'] as String);
    final typeName = row['type'] as String?;
    final occurredAt = DateTime.parse(row['occurred_at'] as String).toUtc();
    final clientReportId =
        row['client_report_id'] as String? ?? row['id'] as String;
    final clientUpdateToken = row['client_update_token'] as String?;
    return Report(
        id: (row['local_id'] as num).toInt(),
        kind: kind,
        type: typeName == null ? null : IncidentType.values.byName(typeName),
        auto: row['auto'] == 1,
        time: DateFormat('HH:mm').format(occurredAt.toLocal()),
        state: ReportDeliveryState.values.byName(
          row['delivery_state'] as String,
        ),
        occurredAt: occurredAt,
        clientReportId: clientReportId,
        clientUpdateToken: clientUpdateToken,
        serverReportId: row['server_report_id'] as String?,
        latitude: (row['latitude'] as num?)?.toDouble(),
        longitude: (row['longitude'] as num?)?.toDouble(),
        canUndo: row['can_undo'] == null ? true : row['can_undo'] == 1,
        injured: _fromSqlBool(row['injured']),
        trapped: _fromSqlBool(row['trapped']),
        people: (row['people'] as num?)?.toInt() ?? 1,
      )
      ..deliveryFailure = row['delivery_failure'] == null
          ? null
          : ReportDeliveryFailure.values.byName(
              row['delivery_failure'] as String,
            )
      ..detailsRevision = (row['details_revision'] as num?)?.toInt() ?? 0
      ..syncedDetailsRevision =
          (row['synced_details_revision'] as num?)?.toInt() ?? 0;
  }

  bool get _hasPendingWork => _reports.any((report) {
    if (report.state == ReportDeliveryState.sent) {
      return report.detailsRevision > report.syncedDetailsRevision;
    }
    return report.deliveryFailure != ReportDeliveryFailure.location;
  });

  void _scheduleRetry() {
    if (_disposed || _retryTimer?.isActive == true || !_hasPendingWork) return;
    _retryTimer = Timer(_retryDelay, () {
      _retryTimer = null;
      unawaited(_retryPending());
    });
    final nextSeconds = (_retryDelay.inSeconds * 2).clamp(10, 300);
    _retryDelay = Duration(seconds: nextSeconds);
  }

  Future<void> _retryPending() async {
    if (_connectivity.status == NetworkStatus.offline) {
      await syncPending(force: true);
    } else {
      await syncPending();
    }
  }

  void _onNetworkChanged() {
    if (_connectivity.status != NetworkStatus.offline) {
      unawaited(syncPending());
    }
  }

  String _newClientReportId() {
    final random = Random.secure();
    final suffix = List.generate(
      4,
      (_) => random.nextInt(1 << 32).toRadixString(16).padLeft(8, '0'),
    ).join();
    return 'guest-${DateTime.now().microsecondsSinceEpoch}-$suffix';
  }

  String _newClientUpdateToken() {
    final random = Random.secure();
    return List.generate(
      32,
      (_) => random.nextInt(256).toRadixString(16).padLeft(2, '0'),
    ).join();
  }

  String? _apiType(IncidentType? type) => switch (type) {
    IncidentType.quake => 'earthquake',
    IncidentType.crash => 'accident',
    IncidentType.fall => 'fall',
    IncidentType.fire => 'fire',
    IncidentType.other => 'help',
    null => null,
  };

  int? _toSqlBool(bool? value) => value == null ? null : (value ? 1 : 0);

  bool? _fromSqlBool(Object? value) => switch (value) {
    null => null,
    0 => false,
    1 => true,
    _ => throw FormatException('Invalid SQLite boolean value: $value'),
  };

  @override
  int takeFlushedCount() {
    final count = _flushed;
    _flushed = 0;
    return count;
  }

  @override
  void dispose() {
    _disposed = true;
    _retryTimer?.cancel();
    _connectivity.removeListener(_onNetworkChanged);
    if (_ownsClient) _client.close();
    super.dispose();
  }
}

class _ApiReportException implements Exception {
  const _ApiReportException();
}
