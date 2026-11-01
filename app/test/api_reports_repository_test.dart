import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:yasamhatti/data/repositories/api_reports_repository.dart';
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

void main() {
  test('guest report sends incident type and device location to the API', () async {
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
    final repository = ApiReportsRepository(
      apiBaseUrl: Uri.parse('http://10.0.2.2:3000'),
      locationProvider: const _FixedLocationProvider(),
      client: client,
    );
    addTearDown(repository.dispose);

    final report = repository.create(
      kind: ReportKind.help,
      type: IncidentType.crash,
    );
    final delivered = Completer<void>();
    void listener() {
      if (report.state == ReportDeliveryState.sent && !delivered.isCompleted) {
        delivered.complete();
      }
    }

    repository.addListener(listener);
    addTearDown(() => repository.removeListener(listener));
    await delivered.future.timeout(const Duration(seconds: 2));

    final payload = jsonDecode(sentRequest.body) as Map<String, dynamic>;
    expect(sentRequest.url, Uri.parse('http://10.0.2.2:3000/api/v1/reports'));
    expect(payload['type'], 'accident');
    expect(payload['location'], {'latitude': 38.68, 'longitude': 39.22});
    expect(payload['clientReportId'], report.clientReportId);
    expect(payload.containsKey('user_id'), isFalse);
    expect(report.serverReportId, 'server-report-1');
    expect(report.canUndo, isFalse);
  });

  test('failed guest report can be retried with the same idempotency key', () async {
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
    final repository = ApiReportsRepository(
      apiBaseUrl: Uri.parse('http://10.0.2.2:3000'),
      locationProvider: const _FixedLocationProvider(),
      client: client,
    );
    addTearDown(repository.dispose);

    final report = repository.create(
      kind: ReportKind.help,
      type: IncidentType.fire,
    );
    final failed = Completer<void>();
    void failureListener() {
      if (report.state == ReportDeliveryState.failed && !failed.isCompleted) {
        failed.complete();
      }
    }

    repository.addListener(failureListener);
    addTearDown(() => repository.removeListener(failureListener));
    await failed.future.timeout(const Duration(seconds: 2));

    final delivered = Completer<void>();
    void deliveryListener() {
      if (report.state == ReportDeliveryState.sent && !delivered.isCompleted) {
        delivered.complete();
      }
    }

    repository.addListener(deliveryListener);
    addTearDown(() => repository.removeListener(deliveryListener));
    repository.retry(report.id);
    await delivered.future.timeout(const Duration(seconds: 2));

    expect(requestCount, 2);
    expect(requestBodies[0], requestBodies[1]);
    expect(
      (jsonDecode(requestBodies[0]) as Map<String, dynamic>)['clientReportId'],
      report.clientReportId,
    );
  });

  test('safe status does not post an emergency report to the API', () async {
    var requestCount = 0;
    final repository = ApiReportsRepository(
      apiBaseUrl: Uri.parse('http://10.0.2.2:3000'),
      locationProvider: const _FixedLocationProvider(),
      client: MockClient((_) async {
        requestCount++;
        return http.Response('{}', 201);
      }),
    );
    addTearDown(repository.dispose);

    final report = repository.create(kind: ReportKind.safe);

    expect(report.state, ReportDeliveryState.localOnly);
    expect(requestCount, 0);
  });

  test('location failure is shown and does not send an incomplete report', () async {
    var requestCount = 0;
    final repository = ApiReportsRepository(
      apiBaseUrl: Uri.parse('http://10.0.2.2:3000'),
      locationProvider: const _UnavailableLocationProvider(),
      client: MockClient((_) async {
        requestCount++;
        return http.Response('{}', 201);
      }),
    );
    addTearDown(repository.dispose);

    final report = repository.create(
      kind: ReportKind.help,
      type: IncidentType.quake,
    );
    final failed = Completer<void>();
    void listener() {
      if (report.state == ReportDeliveryState.failed && !failed.isCompleted) {
        failed.complete();
      }
    }

    repository.addListener(listener);
    addTearDown(() => repository.removeListener(listener));
    await failed.future.timeout(const Duration(seconds: 2));

    expect(report.deliveryFailure, ReportDeliveryFailure.location);
    expect(report.canUndo, isTrue);
    expect(requestCount, 0);
  });
}
