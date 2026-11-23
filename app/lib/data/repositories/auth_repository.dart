import 'package:flutter_secure_storage/flutter_secure_storage.dart';

abstract interface class AuthTokenStore {
  Future<String?> readToken();
  Future<void> writeToken(String token);
  Future<void> clearToken();
}

class SecureAuthTokenStore implements AuthTokenStore {
  SecureAuthTokenStore({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  static const _tokenKey = 'access_token';
  final FlutterSecureStorage _storage;

  @override
  Future<String?> readToken() => _storage.read(key: _tokenKey);

  @override
  Future<void> writeToken(String token) =>
      _storage.write(key: _tokenKey, value: token);

  @override
  Future<void> clearToken() => _storage.delete(key: _tokenKey);
}

abstract interface class AuthRepository {
  Future<void> requestOtp(String phoneNumber);
  Future<void> verifyOtp({required String phoneNumber, required String code});
  Future<String?> readAccessToken();
  Future<void> logout();
  void clearChallenge();
  void dispose();
}

class AuthApiException implements Exception {
  const AuthApiException(this.code, {this.statusCode});

  final String code;
  final int? statusCode;
}

class FakeAuthRepository implements AuthRepository {
  FakeAuthRepository({String? accessToken}) : _accessToken = accessToken;

  String? _accessToken;

  @override
  Future<void> requestOtp(String phoneNumber) async {}

  @override
  Future<void> verifyOtp({
    required String phoneNumber,
    required String code,
  }) async {
    _accessToken = 'test-session-token';
  }

  @override
  Future<String?> readAccessToken() async => _accessToken;

  @override
  Future<void> logout() async {
    _accessToken = null;
  }

  @override
  void clearChallenge() {}

  @override
  void dispose() {}
}
