import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:yasamhatti/data/repositories/api_volunteer_repository.dart';
import 'package:yasamhatti/data/repositories/auth_repository.dart';
import 'package:yasamhatti/data/repositories/connectivity_repository.dart';
import 'package:yasamhatti/data/repositories/volunteer_repository.dart';
import 'package:yasamhatti/domain/models/models.dart';

void main() {
  test(
    'loads real needs and sends assignment ids with the bearer token',
    () async {
      final requests = <http.Request>[];
      final repository = ApiVolunteerRepository(
        apiBaseUrl: Uri.parse('https://api.example.test'),
        authRepository: FakeAuthRepository(accessToken: 'session-token'),
        connectivity: FakeConnectivityRepository(),
        client: MockClient((request) async {
          requests.add(request);
          final dashboard = {
            'volunteer': {
              'role': 'aid',
              'hasCertificate': true,
              'available': true,
            },
            'needs': [
              {
                'id': 'need-uuid',
                'type': 'first aid',
                'description': 'Check the injured person.',
                'urgency': 2,
                'eventTitle': 'Earthquake',
                'meters': null,
              },
            ],
            'task': request.method == 'POST'
                ? {
                    'assignmentId': 'assignment-uuid',
                    'assignedAt': '2030-01-01T10:00:00.000Z',
                    'completedAt': null,
                    'need': {
                      'id': 'need-uuid',
                      'type': 'first aid',
                      'description': 'Check the injured person.',
                      'urgency': 2,
                      'eventTitle': 'Earthquake',
                      'meters': null,
                    },
                  }
                : null,
          };
          return http.Response(jsonEncode({'data': dashboard}), 200);
        }),
      );
      addTearDown(repository.dispose);

      await repository.refresh();
      expect(repository.joined, isTrue);
      expect(repository.needs.single.id, NeedId.aid);
      expect(repository.needs.single.recordId, 'need-uuid');
      expect(repository.needs.single.description, 'Check the injured person.');

      await repository.accept(NeedId.aid, recordId: 'need-uuid');

      expect(requests.last.headers['authorization'], 'Bearer session-token');
      expect(jsonDecode(requests.last.body), {'needId': 'need-uuid'});
      expect(repository.task?.assignmentId, 'assignment-uuid');
      expect(repository.task?.eventTitle, 'Earthquake');
    },
  );

  test('rejects volunteer requests without an authenticated session', () async {
    final repository = ApiVolunteerRepository(
      apiBaseUrl: Uri.parse('https://api.example.test'),
      authRepository: FakeAuthRepository(),
      connectivity: FakeConnectivityRepository(),
      client: MockClient((_) async => http.Response('{}', 200)),
    );
    addTearDown(repository.dispose);

    await expectLater(
      repository.refresh(),
      throwsA(
        isA<VolunteerApiException>().having(
          (error) => error.code,
          'code',
          'AUTHENTICATION_REQUIRED',
        ),
      ),
    );
  });
}
