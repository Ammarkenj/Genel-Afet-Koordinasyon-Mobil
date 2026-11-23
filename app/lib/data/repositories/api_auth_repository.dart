import 'dart:async';
import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;

import 'auth_repository.dart';

class ApiAuthRepository implements AuthRepository {
  ApiAuthRepository({
    required this.apiBaseUrl,
    AuthTokenStore? tokenStore,
    http.Client? client,
  }) : _tokenStore = tokenStore ?? SecureAuthTokenStore(),
       _client = client ?? http.Client(),
       _ownsClient = client == null;

  final Uri apiBaseUrl;
  final AuthTokenStore _tokenStore;
  final http.Client _client;
  final bool _ownsClient;
  String? _challengeId;
  String? _accessToken;

  @override
  Future<void> requestOtp(String phoneNumber) async {
    _challengeId = null;
    final response = await _sendJson('/api/v1/auth/otp/request', {
      'phoneNumber': phoneNumber,
    }, expectedStatusCode: 202);
    final data = _decodeData(response);
    final challengeId = data['challengeId'];
    if (challengeId is! String || challengeId.isEmpty) {
      throw AuthApiException(
        'INVALID_RESPONSE',
        statusCode: response.statusCode,
      );
    }
    _challengeId = challengeId;
  }

  @override
  Future<void> verifyOtp({
    required String phoneNumber,
    required String code,
  }) async {
    final challengeId = _challengeId;
    if (challengeId == null) {
      throw const AuthApiException('OTP_CHALLENGE_MISSING');
    }
    final response = await _sendJson('/api/v1/auth/otp/verify', {
      'challengeId': challengeId,
      'phoneNumber': phoneNumber,
      'code': code,
    }, expectedStatusCode: 200);
    final data = _decodeData(response);
    final token = data['token'];
    if (token is! String || token.isEmpty) {
      throw AuthApiException(
        'INVALID_RESPONSE',
        statusCode: response.statusCode,
      );
    }

    try {
      await _tokenStore.writeToken(token);
    } on PlatformException {
      throw const AuthApiException('SESSION_STORAGE_FAILED');
    }
    _accessToken = token;
    _challengeId = null;
  }

  @override
  Future<String?> readAccessToken() async {
    if (_accessToken != null) return _accessToken;
    try {
      _accessToken = await _tokenStore.readToken();
    } on PlatformException {
      throw const AuthApiException('SESSION_STORAGE_FAILED');
    }
    return _accessToken;
  }

  @override
  Future<void> logout() async {
    final token = await readAccessToken();
    try {
      if (token != null) {
        final response = await _sendJson(
          '/api/v1/auth/logout',
          const {},
          expectedStatusCode: 204,
          additionalAcceptedStatusCodes: const {401},
          bearerToken: token,
        );
        if (response.statusCode != 204 && response.statusCode != 401) {
          _throwApiError(response);
        }
      }
    } finally {
      _accessToken = null;
      try {
        await _tokenStore.clearToken();
      } on PlatformException {
        throw const AuthApiException('SESSION_STORAGE_FAILED');
      }
    }
  }

  @override
  void clearChallenge() => _challengeId = null;

  Future<http.Response> _sendJson(
    String path,
    Map<String, Object?> body, {
    required int expectedStatusCode,
    Set<int> additionalAcceptedStatusCodes = const {},
    String? bearerToken,
  }) async {
    late final http.Response response;
    try {
      response = await _client
          .post(
            apiBaseUrl.resolve(path),
            headers: {
              'content-type': 'application/json',
              if (bearerToken != null) 'authorization': 'Bearer $bearerToken',
            },
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 15));
    } on TimeoutException {
      throw const AuthApiException('CONNECTION_FAILED');
    } on http.ClientException {
      throw const AuthApiException('CONNECTION_FAILED');
    }

    if (response.statusCode != expectedStatusCode &&
        !additionalAcceptedStatusCodes.contains(response.statusCode)) {
      _throwApiError(response);
    }
    return response;
  }

  Never _throwApiError(http.Response response) {
    var code = 'SERVER_ERROR';
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic> &&
          decoded['error'] is Map<String, dynamic>) {
        final value = (decoded['error'] as Map<String, dynamic>)['code'];
        if (value is String && value.isNotEmpty) code = value;
      }
    } on FormatException {
      // Keep the HTTP status as the actionable error when the body is not JSON.
    }
    throw AuthApiException(code, statusCode: response.statusCode);
  }

  Map<String, dynamic> _decodeData(http.Response response) {
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic> &&
          decoded['data'] is Map<String, dynamic>) {
        return decoded['data'] as Map<String, dynamic>;
      }
    } on FormatException {
      throw AuthApiException(
        'INVALID_RESPONSE',
        statusCode: response.statusCode,
      );
    }
    throw AuthApiException('INVALID_RESPONSE', statusCode: response.statusCode);
  }

  @override
  void dispose() {
    if (_ownsClient) _client.close();
  }
}
