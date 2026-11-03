import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../../domain/models/alert_model.dart';

abstract class AlertRepository implements Listenable {
  List<EmergencyAlert> get activeAlerts;
  Stream<EmergencyAlert> get alertStream;

  Future<void> registerDeviceToken({
    required String token,
    String? cityCode,
    String? language,
  });

  Future<List<EmergencyAlert>> fetchActiveAlerts();
  void dismissAlert(String alertId);
  void triggerAlert(EmergencyAlert alert);
  void dispose();
}

class ApiAlertRepository extends ChangeNotifier implements AlertRepository {
  ApiAlertRepository({
    required this.apiBaseUrl,
    http.Client? client,
  })  : _client = client ?? http.Client(),
        _ownsClient = client == null;

  final Uri apiBaseUrl;
  final http.Client _client;
  final bool _ownsClient;
  final List<EmergencyAlert> _activeAlerts = [];
  final StreamController<EmergencyAlert> _streamController =
      StreamController<EmergencyAlert>.broadcast();

  bool _disposed = false;

  @override
  List<EmergencyAlert> get activeAlerts => List.unmodifiable(_activeAlerts);

  @override
  Stream<EmergencyAlert> get alertStream => _streamController.stream;

  @override
  Future<void> registerDeviceToken({
    required String token,
    String? cityCode,
    String? language,
  }) async {
    try {
      final response = await _client
          .post(
            apiBaseUrl.resolve('/api/v1/devices/register'),
            headers: const {'content-type': 'application/json'},
            body: jsonEncode({
              'token': token,
              'platform': 'android',
              'cityCode': cityCode,
              'language': language ?? 'tr',
            }),
          )
          .timeout(const Duration(seconds: 15));

      if (response.statusCode != 200 && response.statusCode != 201) {
        debugPrint('Device token registration returned status ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Device token registration failed: $e');
    }
  }

  @override
  Future<List<EmergencyAlert>> fetchActiveAlerts() async {
    try {
      final response = await _client
          .get(apiBaseUrl.resolve('/api/v1/alerts/active'))
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final body = jsonDecode(utf8.decode(response.bodyBytes));
        if (body is Map<String, dynamic> && body['data'] is List) {
          final items = (body['data'] as List)
              .map((item) => EmergencyAlert.fromJson(item as Map<String, dynamic>))
              .toList();

          _activeAlerts.clear();
          _activeAlerts.addAll(items);
          if (!_disposed) notifyListeners();
          return items;
        }
      }
    } catch (e) {
      debugPrint('Fetching active alerts failed: $e');
    }
    return activeAlerts;
  }

  @override
  void triggerAlert(EmergencyAlert alert) {
    if (_disposed) return;
    _activeAlerts.removeWhere((a) => a.id == alert.id);
    _activeAlerts.insert(0, alert);
    _streamController.add(alert);
    notifyListeners();
  }

  @override
  void dismissAlert(String alertId) {
    _activeAlerts.removeWhere((a) => a.id == alertId);
    if (!_disposed) notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    _streamController.close();
    if (_ownsClient) _client.close();
    super.dispose();
  }
}

class FakeAlertRepository extends ChangeNotifier implements AlertRepository {
  FakeAlertRepository({List<EmergencyAlert>? initialAlerts})
      : _activeAlerts = initialAlerts ?? [];

  final List<EmergencyAlert> _activeAlerts;
  final StreamController<EmergencyAlert> _streamController =
      StreamController<EmergencyAlert>.broadcast();

  @override
  List<EmergencyAlert> get activeAlerts => List.unmodifiable(_activeAlerts);

  @override
  Stream<EmergencyAlert> get alertStream => _streamController.stream;

  @override
  Future<void> registerDeviceToken({
    required String token,
    String? cityCode,
    String? language,
  }) async {}

  @override
  Future<List<EmergencyAlert>> fetchActiveAlerts() async => activeAlerts;

  @override
  void triggerAlert(EmergencyAlert alert) {
    _activeAlerts.removeWhere((a) => a.id == alert.id);
    _activeAlerts.insert(0, alert);
    _streamController.add(alert);
    notifyListeners();
  }

  @override
  void dismissAlert(String alertId) {
    _activeAlerts.removeWhere((a) => a.id == alertId);
    notifyListeners();
  }

  @override
  void dispose() {
    _streamController.close();
    super.dispose();
  }
}
