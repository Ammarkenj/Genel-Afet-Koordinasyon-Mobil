import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:yasamhatti/app.dart';
import 'package:yasamhatti/data/repositories/catalog_repository.dart';
import 'package:yasamhatti/data/repositories/connectivity_repository.dart';
import 'package:yasamhatti/domain/models/models.dart';

import 'support/test_app.dart';

class _MemoryCatalogRepository extends ChangeNotifier
    implements CatalogRepository {
  _MemoryCatalogRepository({this.guides = const [], this.lastError});

  @override
  final List<EmergencyGuide> guides;

  @override
  final CatalogSyncException? lastError;

  @override
  List<Shelter> get shelters => const [];

  @override
  bool get refreshing => false;

  int refreshCount = 0;

  @override
  Future<void> initialize() async {}

  @override
  Future<void> refresh() async {}

  @override
  void refreshInBackground() {
    refreshCount++;
  }
}

void main() {
  testApp('tools opens cached emergency guides and expands their content', (
    tester,
  ) async {
    final catalogs = _MemoryCatalogRepository(
      guides: const [
        EmergencyGuide(
          id: 'quake-guide',
          title: 'Deprem anında ne yapılmalı?',
          category: 'Deprem',
          content: 'Pencerelerden uzak durun.',
        ),
      ],
    );
    final connectivity = FakeConnectivityRepository()
      ..setStatus(NetworkStatus.offline);

    final app = await pumpApp(
      tester,
      location: '/tools',
      dependencies: AppDependencies(
        catalogs: catalogs,
        connectivity: connectivity,
      ),
    );
    connectivity.setStatus(NetworkStatus.offline);
    await app.settle();

    await app.tapText(app.l.guidesEntryTitle);

    expect(find.text(app.l.guidesTitle), findsOneWidget);
    expect(find.text(app.l.guidesOffline), findsOneWidget);
    expect(find.text('Deprem anında ne yapılmalı?'), findsOneWidget);
    expect(find.text('Pencerelerden uzak durun.'), findsNothing);

    await app.tapText('Deprem anında ne yapılmalı?');

    expect(find.text('Pencerelerden uzak durun.'), findsOneWidget);
  });

  testApp('guides show cached content and allow retry after sync failure', (
    tester,
  ) async {
    final catalogs = _MemoryCatalogRepository(
      guides: const [
        EmergencyGuide(
          id: 'first-aid',
          title: 'İlk yardım',
          category: 'Hazırlık',
          content: 'Önce çevre güvenliğini kontrol edin.',
        ),
      ],
      lastError: const CatalogSyncException('Catalog refresh failed.'),
    );
    final app = await pumpApp(
      tester,
      location: '/tools/guides',
      dependencies: AppDependencies(catalogs: catalogs),
    );

    expect(find.text(app.l.guidesStale), findsOneWidget);
    expect(find.text(app.l.guidesLoadFailed), findsOneWidget);
    expect(find.text('İlk yardım'), findsOneWidget);

    await app.tapText(app.l.guidesRefresh);

    expect(catalogs.refreshCount, 1);
  });
}
