import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:yasamhatti/data/local/daos/guide_dao.dart';
import 'package:yasamhatti/data/local/daos/shelter_dao.dart';
import 'package:yasamhatti/data/repositories/catalog_repository.dart';
import 'package:yasamhatti/data/repositories/connectivity_repository.dart';
import 'package:yasamhatti/domain/models/models.dart';

class _MemoryShelterDao extends ShelterDao {
  _MemoryShelterDao([this.records = const []]);

  List<Shelter> records;

  @override
  Future<List<Shelter>> getAllShelters() async => List.of(records);

  @override
  Future<void> replaceAll(List<Shelter> shelters) async {
    records = List.of(shelters);
  }
}

class _MemoryGuideDao extends GuideDao {
  _MemoryGuideDao([this.records = const []]);

  List<EmergencyGuide> records;

  @override
  Future<List<EmergencyGuide>> getAllGuides() async => List.of(records);

  @override
  Future<void> replaceAll(List<EmergencyGuide> guides) async {
    records = List.of(guides);
  }
}

void main() {
  test(
    'offline initialization exposes cached catalogs without making requests',
    () async {
      var requestCount = 0;
      final shelters = _MemoryShelterDao([
        const Shelter(
          id: 'cached-shelter',
          name: 'Local shelter',
          category: 'School',
          latitude: 38.6,
          longitude: 39.2,
        ),
      ]);
      final guides = _MemoryGuideDao([
        const EmergencyGuide(
          id: 'cached-guide',
          title: 'Local guide',
          category: 'Safety',
          content: 'Cached instructions.',
        ),
      ]);
      final connectivity = FakeConnectivityRepository()
        ..setStatus(NetworkStatus.offline);
      final repository = ApiCatalogRepository(
        apiBaseUrl: Uri.parse('http://127.0.0.1:3000'),
        connectivity: connectivity,
        shelterDao: shelters,
        guideDao: guides,
        client: MockClient((_) async {
          requestCount++;
          return http.Response('{}', 404);
        }),
      );
      addTearDown(repository.dispose);
      addTearDown(connectivity.dispose);

      await repository.initialize();

      expect(repository.shelters.single.id, 'cached-shelter');
      expect(repository.guides.single.id, 'cached-guide');
      expect(requestCount, 0);
    },
  );

  test(
    'refresh replaces local shelter and guide caches from the API',
    () async {
      final paths = <String>[];
      final shelters = _MemoryShelterDao();
      final guides = _MemoryGuideDao();
      final connectivity = FakeConnectivityRepository();
      final repository = ApiCatalogRepository(
        apiBaseUrl: Uri.parse('http://127.0.0.1:3000'),
        connectivity: connectivity,
        shelterDao: shelters,
        guideDao: guides,
        client: MockClient((request) async {
          paths.add(request.url.path);
          final records = switch (request.url.path) {
            '/api/v1/shelters' => [
              {
                'id': 'server-shelter',
                'name': 'Central shelter',
                'category': 'Sports hall',
                'capacity': 1500,
                'latitude': 38.675,
                'longitude': 39.22,
                'features': 'Blankets',
              },
            ],
            '/api/v1/guides' => [
              {
                'id': 'server-guide',
                'title': 'Earthquake safety',
                'category': 'Earthquake',
                'content': 'Stay away from windows.',
              },
            ],
            _ => throw StateError('Unexpected URL ${request.url}'),
          };
          return http.Response(jsonEncode({'data': records}), 200);
        }),
      );
      addTearDown(repository.dispose);
      addTearDown(connectivity.dispose);

      await repository.initialize();
      await repository.refresh();

      expect(paths, ['/api/v1/shelters', '/api/v1/guides']);
      expect(repository.shelters.single.id, 'server-shelter');
      expect(repository.guides.single.id, 'server-guide');
      expect(shelters.records.single.capacity, 1500);
      expect(guides.records.single.content, 'Stay away from windows.');
      expect(repository.lastError, isNull);
    },
  );

  test(
    'invalid API data leaves the cached catalog intact and reports an error',
    () async {
      final cached = const Shelter(
        id: 'cached-shelter',
        name: 'Local shelter',
        category: 'School',
        latitude: 38.6,
        longitude: 39.2,
      );
      final shelters = _MemoryShelterDao([cached]);
      final connectivity = FakeConnectivityRepository();
      final repository = ApiCatalogRepository(
        apiBaseUrl: Uri.parse('http://127.0.0.1:3000'),
        connectivity: connectivity,
        shelterDao: shelters,
        guideDao: _MemoryGuideDao(),
        client: MockClient(
          (_) async => http.Response(
            jsonEncode({
              'data': [
                {'id': 42},
              ],
            }),
            200,
          ),
        ),
      );
      addTearDown(repository.dispose);
      addTearDown(connectivity.dispose);

      await repository.initialize();

      await expectLater(
        repository.refresh(),
        throwsA(isA<CatalogSyncException>()),
      );

      expect(repository.shelters.single.id, cached.id);
      expect(shelters.records.single.id, cached.id);
      expect(repository.lastError, isA<CatalogSyncException>());
    },
  );
}
