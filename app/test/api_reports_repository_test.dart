import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:yasamhatti/data/local/daos/report_dao.dart';
import 'package:yasamhatti/data/repositories/api_reports_repository.dart';
import 'package:yasamhatti/data/repositories/connectivity_repository.dart';
import 'package:yasamhatti/domain/models/models.dart';

class _FixedLocationProvider implements ReportLocationProvider {
  const _FixedLocationProvider();

  @override
  Future<ReportCoordinates> currentLocation() async =>
      const ReportCoordinates(38.68, 39.22);
}

class _UnavailableLocationProvider implements ReportLocationProvider {
  const _UnavailableLocationProvider();

  @override
  Future<ReportCoordinates> currentLocation() =>
      Future.error(const ReportLocationException());
}

class _MemoryReportDao extends ReportDao {
  final Map<String, Map<String, Object?>> _rows = {};
  int _nextId = 1;

  @override
  Future<int> insertReport(Map<String, Object?> report) async {
    final id = _nextId++;
    _rows[report['client_report_id']! as String] = {...report, 'local_id': id};
    return id;
  }

  @override
  Future<List<Map<String, Object?>>> getReports() async =>
      _rows.values.map((row) => Map<String, Object?>.of(row)).toList();

  @override
  Future<List<Map<String, Object?>>> getUnsyncedReports() async => _rows.values
      .where((row) => row['is_synced'] == 0)
      .map((row) => Map<String, Object?>.of(row))
      .toList();

  @override
  Future<int> updateReport(
    String clientReportId,
    Map<String, Object?> values,
  ) async {
    final row = _rows[clientReportId];
    if (row == null) return 0;
    row.addAll(values);
    return 1;
  }

  @override
  Future<int> deleteQueuedReport(String clientReportId) async {
    final row = _rows[clientReportId];
    if (row == null || row['is_synced'] != 0) return 0;
    _rows.remove(clientReportId);
    return 1;
  }
}

ApiReportsRepository _repository({
  ReportLocationProvider locationProvider = const _FixedLocationProvider(),
  http.Client? client,
  _MemoryReportDao? reportDao,
  FakeConnectivityRepository? connectivity,
}) => ApiReportsRepository(
  apiBaseUrl: Uri.parse('http://10.0.2.2:3000'),
  locationProvider: locationProvider,
  connectivity: connectivity ?? FakeConnectivityRepository(),
  reportDao: reportDao ?? _MemoryReportDao(),
  client: client,
);

Future<void> _waitForState(
  ApiReportsRepository repository,
  Report report,
  ReportDeliveryState state,
) async {
  if (report.state == state) return;
  final changed = Completer<void>();
  void listener() {
    if (report.state == state && !changed.isCompleted) changed.complete();
  }

  repository.addListener(listener);
  try {
    await changed.future.timeout(const Duration(seconds: 2));
  } finally {
    repository.removeListener(listener);
  }
}

Future<void> _waitForDetailsSync(
  ApiReportsRepository repository,
  Report report,
) async {
  if (report.syncedDetailsRevision == report.detailsRevision) return;
  final changed = Completer<void>();
  void listener() {
    if (report.syncedDetailsRevision == report.detailsRevision &&
        !changed.isCompleted) {
      changed.complete();
    }
  }

  repository.addListener(listener);
  try {
    await changed.future.timeout(const Duration(seconds: 2));
  } finally {
    repository.removeListener(listener);
  }
}

void main() {
  test(
    'guest report sends incident type and device location to the API',
    () async {
      late http.Request sentRequest;
      final client = MockClient((request) async {
        sentRequest = request;
        return http.Response(
          jsonEncode({
            'data': {'id': 'server-report-1'},
            'duplicate': false,
          }),
          201,
        );
      });
      final repository = _repository(client: client);
      addTearDown(repository.dispose);

      final report = await repository.create(
        kind: ReportKind.help,
        type: IncidentType.crash,
      );
      await _waitForState(repository, report, ReportDeliveryState.sent);

      final payload = jsonDecode(sentRequest.body) as Map<String, dynamic>;
      expect(sentRequest.url, Uri.parse('http://10.0.2.2:3000/api/v1/reports'));
      expect(payload['type'], 'accident');
      expect(payload['location'], {'latitude': 38.68, 'longitude': 39.22});
      expect(payload['clientReportId'], report.clientReportId);
      expect(payload.containsKey('user_id'), isFalse);
      expect(report.serverReportId, 'server-report-1');
      expect(report.canUndo, isFalse);
    },
  );

  test(
    'failed guest report can be retried with the same idempotency key',
    () async {
      var requestCount = 0;
      final requestBodies = <String>[];
      final client = MockClient((request) async {
        requestCount++;
        requestBodies.add(request.body);
        if (requestCount == 1) return http.Response('{}', 503);
        return http.Response(
          jsonEncode({
            'data': {'id': 'server-report-2'},
            'duplicate': false,
          }),
          201,
        );
      });
      final repository = _repository(client: client);
      addTearDown(repository.dispose);

      final report = await repository.create(
        kind: ReportKind.help,
        type: IncidentType.fire,
      );
      await _waitForState(repository, report, ReportDeliveryState.failed);
      await repository.retry(report.id);
      await _waitForState(repository, report, ReportDeliveryState.sent);

      expect(requestCount, 2);
      expect(requestBodies[0], requestBodies[1]);
      expect(
        (jsonDecode(requestBodies[0])
            as Map<String, dynamic>)['clientReportId'],
        report.clientReportId,
      );
    },
  );

  test('safe status is saved and sent as a safe report', () async {
    late http.Request sentRequest;
    final repository = _repository(
      client: MockClient((request) async {
        sentRequest = request;
        return http.Response(
          jsonEncode({
            'data': {'id': 'server-safe-report'},
            'duplicate': false,
          }),
          201,
        );
      }),
    );
    addTearDown(repository.dispose);

    final report = await repository.create(kind: ReportKind.safe);
    await _waitForState(repository, report, ReportDeliveryState.sent);

    final payload = jsonDecode(sentRequest.body) as Map<String, dynamic>;
    expect(payload['kind'], 'safe');
    expect(payload['type'], isNull);
    expect(report.state, ReportDeliveryState.sent);
  });

  test(
    'location failure is shown and does not send an incomplete report',
    () async {
      var requestCount = 0;
      final repository = _repository(
        locationProvider: const _UnavailableLocationProvider(),
        client: MockClient((_) async {
          requestCount++;
          return http.Response('{}', 201);
        }),
      );
      addTearDown(repository.dispose);

      final report = await repository.create(
        kind: ReportKind.help,
        type: IncidentType.quake,
      );
      await _waitForState(repository, report, ReportDeliveryState.failed);

      expect(report.deliveryFailure, ReportDeliveryFailure.location);
      expect(report.canUndo, isTrue);
      expect(requestCount, 0);
    },
  );

  test(
    'queued reports restore after restart and sync follow-up details',
    () async {
      final dao = _MemoryReportDao();
      final connectivity = FakeConnectivityRepository()
        ..setStatus(NetworkStatus.offline);
      final firstRepository = _repository(
        reportDao: dao,
        connectivity: connectivity,
      );
      final queued = await firstRepository.create(
        kind: ReportKind.help,
        type: IncidentType.quake,
      );
      final clientReportId = queued.clientReportId;
      final clientUpdateToken = queued.clientUpdateToken;
      firstRepository.dispose();

      final methods = <String>[];
      final detailBodies = <String>[];
      final resumedRepository = _repository(
        reportDao: dao,
        connectivity: connectivity,
        client: MockClient((request) async {
          methods.add(request.method);
          if (request.method == 'POST') {
            return http.Response(
              jsonEncode({
                'data': {'id': 'server-restored-report'},
                'duplicate': false,
              }),
              201,
            );
          }
          detailBodies.add(request.body);
          return http.Response('{}', 200);
        }),
      );
      addTearDown(resumedRepository.dispose);

      await resumedRepository.initialize();
      final restored = resumedRepository.byId(queued.id)!;
      expect(restored.state, ReportDeliveryState.queued);
      expect(restored.clientReportId, clientReportId);
      expect(restored.clientUpdateToken, clientUpdateToken);

      connectivity.setStatus(NetworkStatus.online);
      await _waitForState(
        resumedRepository,
        restored,
        ReportDeliveryState.sent,
      );
      await resumedRepository.update(restored.id, injured: true, people: 2);
      await _waitForDetailsSync(resumedRepository, restored);

      expect(methods, ['POST', 'PATCH']);
      final details = jsonDecode(detailBodies.single) as Map<String, dynamic>;
      expect(details['clientUpdateToken'], clientUpdateToken);
      expect(details['injured'], isTrue);
      expect(details['people'], 2);
    },
  );
}
