import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yasamhatti/app.dart';
import 'package:yasamhatti/data/repositories/catalog_repository.dart';
import 'package:yasamhatti/domain/models/models.dart';

import 'support/test_app.dart';

class _TestCatalogRepository extends ChangeNotifier
    implements CatalogRepository {
  _TestCatalogRepository(this._shelters);

  List<Shelter> _shelters;

  @override
  List<Shelter> get shelters => List.unmodifiable(_shelters);

  @override
  List<EmergencyGuide> get guides => const [];

  @override
  bool get refreshing => false;

  @override
  CatalogSyncException? get lastError => null;

  @override
  Future<void> initialize() async {}

  @override
  Future<void> refresh() async {}

  @override
  void refreshInBackground() {}

  void replaceShelters(List<Shelter> shelters) {
    _shelters = shelters;
    notifyListeners();
  }
}

void main() {
  testApp('map shows and updates catalog shelter details', (
    tester,
  ) async {
    final catalog = _TestCatalogRepository([
      const Shelter(
        id: 'shelter-1',
        name: 'Merkez Tahliye Noktası',
        category: 'Okul',
        capacity: 500,
        latitude: 38.681,
        longitude: 39.22,
        features: 'İlk yardım, su',
      ),
    ]);
    await pumpApp(
      tester,
      location: '/map',
      dependencies: AppDependencies(catalogs: catalog),
    );

    expect(find.text('Merkez Tahliye Noktası'), findsOneWidget);
    expect(find.textContaining('38.68100, 39.22000'), findsOneWidget);
    expect(find.text('Kapasite: 500 kişi'), findsOneWidget);
    expect(find.text('Özellikler: İlk yardım, su'), findsOneWidget);

    catalog.replaceShelters([
      const Shelter(
        id: 'shelter-2',
        name: 'Yeni Geçici Barınak',
        category: 'Spor Salonu',
        latitude: 38.7,
        longitude: 39.3,
      ),
    ]);
    await tester.pumpAndSettle();

    expect(find.text('Yeni Geçici Barınak'), findsOneWidget);
    expect(find.text('Merkez Tahliye Noktası'), findsNothing);
  });

  testApp('map shows an empty state when no cached shelters exist', (
    tester,
  ) async {
    await pumpApp(tester, location: '/map');

    expect(find.text('Henüz barınak kaydı yok.'), findsOneWidget);
    expect(find.text('Kültür Park Toplanma Alanı'), findsNothing);
  });
}
