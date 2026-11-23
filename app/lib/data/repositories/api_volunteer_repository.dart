import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';

import '../../domain/models/models.dart';
import 'auth_repository.dart';
import 'connectivity_repository.dart';
import 'volunteer_repository.dart';

class ApiVolunteerRepository extends VolunteerRepository {
  ApiVolunteerRepository({
    required Uri apiBaseUrl,
    required AuthRepository authRepository,
    required ConnectivityRepository connectivity,
    http.Client? client,
  }) : _apiBaseUrl = apiBaseUrl,
       _authRepository = authRepository,
       _connectivity = connectivity,
       _client = client ?? http.Client(),
       _ownsClient = client == null;

  final Uri _apiBaseUrl;
  final AuthRepository _authRepository;
  final ConnectivityRepository _connectivity;
  final http.Client _client;
  final bool _ownsClient;

  bool _hasLoaded = false;
  VolunteerRole _role = VolunteerRole.rescue;
  bool _hasCertificate = false;
  bool _joined = false;
  bool _available = false;
  List<VolunteerNeed> _needs = [];
  VolunteerTask? _task;

  @override
  bool get isDemo => false;

  @override
  bool get hasLoaded => _hasLoaded;

  @override
  VolunteerRole get role => _role;

  @override
  bool get hasCertificate => _hasCertificate;

  @override
  bool get joined => _joined;

  @override
  bool get available => _available;

  @override
  List<VolunteerNeed> get needs => List.unmodifiable(_needs);

  @override
  VolunteerTask? get task => _task;

  @override
  int takeFlushedCount() => 0;

  @override
  Future<void> refresh() async {
    final data = await _request('GET', '/api/v1/volunteers/me');
    _applyDashboard(data);
  }

  @override
  Future<void> register({
    required VolunteerRole role,
    required bool hasCertificate,
  }) async {
    final data = await _request(
      'PUT',
      '/api/v1/volunteers/me',
      body: {'role': role.name, 'hasCertificate': hasCertificate},
    );
    _applyDashboard(data);
  }

  @override
  Future<void> setAvailable(bool available) async {
    final data = await _request(
      'PATCH',
      '/api/v1/volunteers/me/availability',
      body: {'available': available},
    );
    _applyDashboard(data);
  }

  @override
  Future<bool> accept(NeedId needId, {String? recordId}) async {
    if (recordId == null) {
      throw const VolunteerApiException('INVALID_NEED_ID');
    }
    final data = await _request(
      'POST',
      '/api/v1/volunteers/me/assignments',
      body: {'needId': recordId},
    );
    _applyDashboard(data);
    return true;
  }

  @override
  Future<void> complete() async {
    final assignmentId = _task?.assignmentId;
    if (assignmentId == null) {
      throw const VolunteerApiException('ACTIVE_ASSIGNMENT_NOT_FOUND');
    }
    final data = await _request(
      'PATCH',
      '/api/v1/volunteers/me/assignments/$assignmentId/complete',
    );
    _applyDashboard(data);
  }

  Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, Object?>? body,
  }) async {
    if (_connectivity.status == NetworkStatus.offline) {
      throw const VolunteerApiException('CONNECTION_FAILED');
    }

    final String? token;
    try {
      token = await _authRepository.readAccessToken();
    } on AuthApiException catch (error) {
      throw VolunteerApiException(error.code, statusCode: error.statusCode);
    }
    if (token == null || token.isEmpty) {
      throw const VolunteerApiException('AUTHENTICATION_REQUIRED');
    }

    late final http.Response response;
    try {
      final request = http.Request(method, _apiBaseUrl.resolve(path))
        ..headers.addAll({
          'accept': 'application/json',
          'authorization': 'Bearer $token',
        });
      if (body != null) {
        request.headers['content-type'] = 'application/json';
        request.body = jsonEncode(body);
      }
      final streamed = await _client
          .send(request)
          .timeout(const Duration(seconds: 15));
      response = await http.Response.fromStream(streamed)
          .timeout(const Duration(seconds: 15));
    } on TimeoutException {
      throw const VolunteerApiException('CONNECTION_FAILED');
    } on http.ClientException {
      throw const VolunteerApiException('CONNECTION_FAILED');
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw VolunteerApiException(
        _errorCode(response.body),
        statusCode: response.statusCode,
      );
    }
    return _decodeData(response);
  }

  String _errorCode(String body) {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic> &&
          decoded['error'] is Map<String, dynamic>) {
        final code = (decoded['error'] as Map<String, dynamic>)['code'];
        if (code is String && code.isNotEmpty) return code;
      }
    } on FormatException {
      return 'SERVER_ERROR';
    }
    return 'SERVER_ERROR';
  }

  Map<String, dynamic> _decodeData(http.Response response) {
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic> &&
          decoded['data'] is Map<String, dynamic>) {
        return decoded['data'] as Map<String, dynamic>;
      }
    } on FormatException {
      throw VolunteerApiException(
        'INVALID_RESPONSE',
        statusCode: response.statusCode,
      );
    }
    throw VolunteerApiException(
      'INVALID_RESPONSE',
      statusCode: response.statusCode,
    );
  }

  void _applyDashboard(Map<String, dynamic> data) {
    final volunteer = data['volunteer'];
    if (volunteer != null && volunteer is! Map<String, dynamic>) {
      throw const VolunteerApiException('INVALID_RESPONSE');
    }
    final needs = data['needs'];
    if (needs is! List<Object?>) {
      throw const VolunteerApiException('INVALID_RESPONSE');
    }
    final taskData = data['task'];
    if (taskData != null && taskData is! Map<String, dynamic>) {
      throw const VolunteerApiException('INVALID_RESPONSE');
    }

    if (volunteer == null) {
      _joined = false;
      _available = false;
      _needs = [];
      _task = null;
      _hasLoaded = true;
      notifyListeners();
      return;
    }

    final profile = volunteer as Map<String, dynamic>;
    _role = _parseRole(profile['role']);
    _hasCertificate = _parseBool(profile['hasCertificate']);
    _available = _parseBool(profile['available']);
    _joined = true;
    _needs = needs.map(_parseNeed).toList(growable: false);
    _task = taskData == null
        ? null
        : _parseTask(taskData as Map<String, dynamic>);
    _hasLoaded = true;
    notifyListeners();
  }

  VolunteerNeed _parseNeed(Object? value) {
    if (value is! Map<String, dynamic>) {
      throw const VolunteerApiException('INVALID_RESPONSE');
    }
    final id = value['id'];
    final urgency = value['urgency'];
    final meters = value['meters'];
    if (id is! String || id.isEmpty || urgency is! int) {
      throw const VolunteerApiException('INVALID_RESPONSE');
    }
    if (meters != null && meters is! num) {
      throw const VolunteerApiException('INVALID_RESPONSE');
    }
    return VolunteerNeed(
      id: _parseNeedType(value['type']),
      recordId: id,
      urgency: urgency,
      meters: (meters as num?)?.round(),
      description: _optionalString(value['description']),
      eventTitle: _optionalString(value['eventTitle']),
    );
  }

  VolunteerTask _parseTask(Map<String, dynamic> value) {
    final assignedAt = value['assignedAt'];
    final need = value['need'];
    if (assignedAt is! String || need is! Map<String, dynamic>) {
      throw const VolunteerApiException('INVALID_RESPONSE');
    }
    final completedAt = value['completedAt'];
    if (completedAt != null && completedAt is! String) {
      throw const VolunteerApiException('INVALID_RESPONSE');
    }
    final parsedNeed = _parseNeed(need);
    final assignmentId = value['assignmentId'];
    if (assignmentId is! String || assignmentId.isEmpty) {
      throw const VolunteerApiException('INVALID_RESPONSE');
    }
    final parsedDate = DateTime.tryParse(assignedAt);
    if (parsedDate == null) {
      throw const VolunteerApiException('INVALID_RESPONSE');
    }
    return VolunteerTask(
      need: parsedNeed.id,
      recordId: parsedNeed.recordId,
      assignmentId: assignmentId,
      eventTitle: parsedNeed.eventTitle,
      time: DateFormat('yyyy-MM-dd HH:mm').format(parsedDate.toLocal()),
      state: DeliveryState.sent,
      done: completedAt != null,
    );
  }

  VolunteerRole _parseRole(Object? value) {
    if (value is! String) {
      throw const VolunteerApiException('INVALID_RESPONSE');
    }
    for (final role in VolunteerRole.values) {
      if (role.name == value) return role;
    }
    throw const VolunteerApiException('INVALID_RESPONSE');
  }

  bool _parseBool(Object? value) {
    if (value is bool) return value;
    throw const VolunteerApiException('INVALID_RESPONSE');
  }

  String? _optionalString(Object? value) {
    if (value == null || value is String) return value as String?;
    throw const VolunteerApiException('INVALID_RESPONSE');
  }

  NeedId _parseNeedType(Object? value) {
    if (value is! String) {
      throw const VolunteerApiException('INVALID_RESPONSE');
    }
    return switch (value.trim().toLowerCase().replaceAll('_', ' ')) {
      'aid' || 'medical' || 'first aid' || 'first aid support' => NeedId.aid,
      'water' || 'water and food' || 'food and water' => NeedId.water,
      'shelter' || 'tent' || 'housing' => NeedId.shelter,
      _ => NeedId.other,
    };
  }

  @override
  void dispose() {
    if (_ownsClient) _client.close();
    super.dispose();
  }
}
