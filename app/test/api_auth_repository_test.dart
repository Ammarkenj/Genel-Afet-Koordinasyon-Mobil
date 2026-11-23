import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:yasamhatti/data/repositories/api_auth_repository.dart';
import 'package:yasamhatti/data/repositories/auth_repository.dart';

class _MemoryAuthTokenStore implements AuthTokenStore {
  String? token;

  @override
  Future<String?> readToken() async => token;

  @override
  Future<void> writeToken(String value) async {
    token = value;
  }

  @override
  Future<void> clearToken() async {
    token = null;
  }
}

void main() {
  test(
    'requests and verifies OTP, persists token, and logs out with bearer',
    () async {
      final tokenStore = _MemoryAuthTokenStore();
      final requests = <http.Request>[];
      final repository = ApiAuthRepository(
        apiBaseUrl: Uri.parse('https://api.example.test'),
        tokenStore: tokenStore,
        client: MockClient((request) async {
          requests.add(request);
          return switch (request.url.path) {
            '/api/v1/auth/otp/request' => http.Response(
              '{"data":{"challengeId":"challenge-1","expiresAt":"2030-01-01T00:00:00.000Z"}}',
              202,
            ),
            '/api/v1/auth/otp/verify' => http.Response(
              '{"data":{"token":"opaque-session-token","expiresAt":"2030-01-31T00:00:00.000Z","user":{"id":"user-1","phoneNumber":"+905321112233","fullName":null}}}',
              200,
            ),
            '/api/v1/auth/logout' => http.Response('', 204),
            _ => throw StateError('Unexpected URL ${request.url}'),
          };
        }),
      );
      addTearDown(repository.dispose);

      await repository.requestOtp('5321112233');
      await repository.verifyOtp(phoneNumber: '5321112233', code: '123456');

      expect(tokenStore.token, 'opaque-session-token');
      expect(await repository.readAccessToken(), 'opaque-session-token');
      expect(jsonDecode(requests[0].body), {'phoneNumber': '5321112233'});
      expect(jsonDecode(requests[1].body), {
        'challengeId': 'challenge-1',
        'phoneNumber': '5321112233',
        'code': '123456',
      });

      await repository.logout();

      expect(
        requests[2].headers['authorization'],
        'Bearer opaque-session-token',
      );
      expect(tokenStore.token, isNull);
    },
  );

  test('surfaces provider and invalid-code API errors', () async {
    var requestAttempts = 0;
    final repository = ApiAuthRepository(
      apiBaseUrl: Uri.parse('https://api.example.test'),
      tokenStore: _MemoryAuthTokenStore(),
      client: MockClient((request) async {
        if (request.url.path.endsWith('/otp/request')) {
          requestAttempts++;
          return requestAttempts == 1
              ? http.Response(
                  '{"error":{"code":"OTP_DELIVERY_UNAVAILABLE"}}',
                  503,
                )
              : http.Response(
                  '{"data":{"challengeId":"challenge-2","expiresAt":"2030-01-01T00:00:00.000Z"}}',
                  202,
                );
        }
        return http.Response(
          '{"error":{"code":"OTP_INVALID_OR_EXPIRED"}}',
          401,
        );
      }),
    );
    addTearDown(repository.dispose);

    await expectLater(
      repository.requestOtp('5321112233'),
      throwsA(
        isA<AuthApiException>().having(
          (error) => error.code,
          'code',
          'OTP_DELIVERY_UNAVAILABLE',
        ),
      ),
    );

    await repository.requestOtp('5321112233');
    await expectLater(
      repository.verifyOtp(phoneNumber: '5321112233', code: '123456'),
      throwsA(
        isA<AuthApiException>().having(
          (error) => error.code,
          'code',
          'OTP_INVALID_OR_EXPIRED',
        ),
      ),
    );
  });
}
