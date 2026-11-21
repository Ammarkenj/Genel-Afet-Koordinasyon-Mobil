import 'package:flutter/foundation.dart';

import '../../../../data/repositories/catalog_repository.dart';
import '../../../../domain/models/models.dart';

/// Keeps the map screen in sync with the shelter catalog.
class MapViewModel extends ChangeNotifier {
  MapViewModel(this._catalogs) {
    _catalogs.addListener(_onCatalogsChanged);
  }

  final CatalogRepository _catalogs;

  List<Shelter> get shelters => _catalogs.shelters;
  bool get refreshing => _catalogs.refreshing;
  CatalogSyncException? get lastError => _catalogs.lastError;

  void refresh() => _catalogs.refreshInBackground();

  void _onCatalogsChanged() {
    notifyListeners();
  }

  @override
  void dispose() {
    _catalogs.removeListener(_onCatalogsChanged);
    super.dispose();
  }
}
