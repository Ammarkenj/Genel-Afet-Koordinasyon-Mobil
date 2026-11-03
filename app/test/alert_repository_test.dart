import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:yasamhatti/data/repositories/alert_repository.dart';
import 'package:yasamhatti/domain/models/alert_model.dart';

void main() {
  group('ApiAlertRepository', () {
    test('registers device token with the backend API', () async {
      late http.Request sentRequest;
      final client = MockClient((request) async {
        sentRequest = request;
        return http.Response(
          jsonEncode({
            'data': {'token': 'device-token-abc-123'},
            'created': true,
          }),
          201,
        );
      });

      final repository = ApiAlertRepository(
        apiBaseUrl: Uri.parse('http://10.0.2.2:3000'),
        client: client,
      );
      addTearDown(repository.dispose);

      await repository.registerDeviceToken(
        token: 'device-token-abc-123',
        cityCode: 'Elazığ',
        language: 'tr',
      );

      final payload = jsonDecode(sentRequest.body) as Map<String, dynamic>;
      expect(sentRequest.url, Uri.parse('http://10.0.2.2:3000/api/v1/devices/register'));
      expect(payload['token'], 'device-token-abc-123');
      expect(payload['cityCode'], 'Elazığ');
      expect(payload['language'], 'tr');
      expect(payload['platform'], 'android');
    });

    test('fetches and parses active emergency alerts from the API', () async {
      final client = MockClient((request) async {
        return http.Response(
          jsonEncode({
            'data': [
              {
                'id': 'alert-test-1',
                'type': 'earthquake',
                'severity': 'critical',
                'title': 'AFAD Deprem Uyarısı',
                'message': '6.4 büyüklüğünde deprem algılandı.',
                'sentAt': '2026-11-02T12:00:00.000Z',
                'location': {
                  'cityName': 'Elazığ',
                  'latitude': 38.68,
                  'longitude': 39.22,
                  'radiusKm': 50,
                },
                'assemblyArea': {
                  'name': 'Kültür Park Toplanma Alanı',
                  'latitude': 38.675,
                  'longitude': 39.215,
                },
                'status': 'active',
              }
            ],
            'count': 1,
          }),
          200,
          headers: {'content-type': 'application/json; charset=utf-8'},
        );
      });

      final repository = ApiAlertRepository(
        apiBaseUrl: Uri.parse('http://10.0.2.2:3000'),
        client: client,
      );
      addTearDown(repository.dispose);

      final alerts = await repository.fetchActiveAlerts();

      expect(alerts.length, 1);
      final alert = alerts.first;
      expect(alert.id, 'alert-test-1');
      expect(alert.type, 'earthquake');
      expect(alert.isCritical, isTrue);
      expect(alert.title, 'AFAD Deprem Uyarısı');
      expect(alert.cityName, 'Elazığ');
      expect(alert.assemblyAreaName, 'Kültür Park Toplanma Alanı');
      expect(alert.assemblyLat, 38.675);
      expect(repository.activeAlerts.length, 1);
    });

    test('triggerAlert emits alert to stream and adds to activeAlerts', () async {
      final repository = ApiAlertRepository(
        apiBaseUrl: Uri.parse('http://10.0.2.2:3000'),
      );
      addTearDown(repository.dispose);

      final alert = EmergencyAlert(
        id: 'alert-stream-test',
        type: 'fire',
        severity: AlertSeverity.warning,
        title: 'Yangın Tehlikesi',
        message: 'Bölgede orman yangını riski bulunmaktadır.',
        sentAt: DateTime.now().toUtc(),
      );

      final emitted = Completer<EmergencyAlert>();
      final sub = repository.alertStream.listen(emitted.complete);
      addTearDown(sub.cancel);

      repository.triggerAlert(alert);

      final received = await emitted.future.timeout(const Duration(seconds: 2));
      expect(received.id, 'alert-stream-test');
      expect(repository.activeAlerts.length, 1);

      // Dismiss alert
      repository.dismissAlert('alert-stream-test');
      expect(repository.activeAlerts.isEmpty, isTrue);
    });
  });

  group('FakeAlertRepository', () {
    test('trigger and dismiss works in memory for testing', () async {
      final repository = FakeAlertRepository();
      addTearDown(repository.dispose);

      final alert = EmergencyAlert(
        id: 'fake-alert-1',
        type: 'earthquake',
        severity: AlertSeverity.critical,
        title: 'Test Alert',
        message: 'This is a test alert.',
        sentAt: DateTime.now().toUtc(),
      );

      repository.triggerAlert(alert);
      expect(repository.activeAlerts.length, 1);
      expect(repository.activeAlerts.first.title, 'Test Alert');

      repository.dismissAlert('fake-alert-1');
      expect(repository.activeAlerts.isEmpty, isTrue);
    });
  });
}
