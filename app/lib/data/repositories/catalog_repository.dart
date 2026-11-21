import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../../domain/models/models.dart';
import '../local/daos/guide_dao.dart';
import '../local/daos/shelter_dao.dart';
import 'connectivity_repository.dart';

abstract class CatalogRepository implements Listenable {
  List<Shelter> get shelters;
  List<EmergencyGuide> get guides;
  bool get refreshing;
  CatalogSyncException? get lastError;

  Future<void> initialize();
  Future<void> refresh();
  void refreshInBackground();
  void dispose();
}

class CatalogSyncException implements Exception {
  const CatalogSyncException(this.message, {this.cause});

  final String message;
  final Object? cause;

  @override
  String toString() => message;
}

class ApiCatalogRepository extends ChangeNotifier implements CatalogRepository {
  ApiCatalogRepository({
    required Uri apiBaseUrl,
    required ConnectivityRepository connectivity,
    ShelterDao? shelterDao,
    GuideDao? guideDao,
    http.Client? client,
  }) : _apiBaseUrl = apiBaseUrl,
       _connectivity = connectivity,
       _shelterDao = shelterDao ?? ShelterDao(),
       _guideDao = guideDao ?? GuideDao(),
       _client = client ?? http.Client(),
       _ownsClient = client == null {
    _connectivity.addListener(_onConnectivityChanged);
  }

  final Uri _apiBaseUrl;
  final ConnectivityRepository _connectivity;
  final ShelterDao _shelterDao;
  final GuideDao _guideDao;
  final http.Client _client;
  final bool _ownsClient;
  List<Shelter> _shelters = [];
  List<EmergencyGuide> _guides = [];
  Future<void>? _initialization;
  Future<void>? _refreshOperation;
  CatalogSyncException? _lastError;
  bool _refreshing = false;
  bool _initialized = false;
  bool _disposed = false;

  @override
  List<Shelter> get shelters => List.unmodifiable(_shelters);

  @override
  List<EmergencyGuide> get guides => List.unmodifiable(_guides);

  @override
  bool get refreshing => _refreshing;

  @override
  CatalogSyncException? get lastError => _lastError;

  @override
  Future<void> initialize() => _initialization ??= _restoreCache();

  Future<void> _restoreCache() async {
    _shelters = await _shelterDao.getAllShelters();
    _guides = await _guideDao.getAllGuides();
    _initialized = true;
    if (!_disposed) notifyListeners();
  }

  @override
  Future<void> refresh() async {
    await initialize();
    if (_connectivity.status == NetworkStatus.offline || _disposed) return;

    final activeOperation = _refreshOperation;
    if (activeOperation != null) return activeOperation;

    final operation = _refreshFromApi();
    _refreshOperation = operation;
    try {
      await operation;
    } finally {
      if (identical(_refreshOperation, operation)) {
        _refreshOperation = null;
      }
    }
  }

  Future<void> _refreshFromApi() async {
    _refreshing = true;
    _lastError = null;
    notifyListeners();

    try {
      final shelters = await _fetchShelters();
      final guides = await _fetchGuides();
      await _shelterDao.replaceAll(shelters);
      await _guideDao.replaceAll(guides);
      _shelters = shelters;
      _guides = guides;
    } on CatalogSyncException catch (error) {
      _lastError = error;
      rethrow;
    } finally {
      _refreshing = false;
      if (!_disposed) notifyListeners();
    }
  }

  Future<List<Shelter>> _fetchShelters() async {
    final records = await _getCatalog('/api/v1/shelters');
    try {
      return records
          .map((record) {
            if (record is! Map<String, dynamic>) {
              throw const FormatException('Shelter record must be an object.');
            }
            return Shelter.fromApiJson(record);
          })
          .toList(growable: false);
    } on FormatException catch (error) {
      throw CatalogSyncException(
        'The shelter catalog response is invalid.',
        cause: error,
      );
    }
  }

  Future<List<EmergencyGuide>> _fetchGuides() async {
    final records = await _getCatalog('/api/v1/guides');
    try {
      return records
          .map((record) {
            if (record is! Map<String, dynamic>) {
              throw const FormatException('Guide record must be an object.');
            }
            return EmergencyGuide.fromApiJson(record);
          })
          .toList(growable: false);
    } on FormatException catch (error) {
      throw CatalogSyncException(
        'The emergency guide response is invalid.',
        cause: error,
      );
    }
  }

  Future<List<Object?>> _getCatalog(String path) async {
    late final http.Response response;
    try {
      response = await _client
          .get(_apiBaseUrl.resolve(path))
          .timeout(const Duration(seconds: 10));
    } on TimeoutException catch (error) {
      throw CatalogSyncException('Catalog request timed out.', cause: error);
    } on http.ClientException catch (error) {
      throw CatalogSyncException('Catalog request failed.', cause: error);
    }

    if (response.statusCode != 200) {
      throw CatalogSyncException(
        'Catalog request failed with status ${response.statusCode}.',
      );
    }

    late final Object? decoded;
    try {
      decoded = jsonDecode(response.body);
    } on FormatException catch (error) {
      throw CatalogSyncException(
        'Catalog response is not valid JSON.',
        cause: error,
      );
    }
    if (decoded is! Map<String, dynamic> || decoded['data'] is! List<Object?>) {
      throw const CatalogSyncException(
        'Catalog response has an invalid shape.',
      );
    }
    return decoded['data'] as List<Object?>;
  }

  @override
  void refreshInBackground() => unawaited(_refreshInBackground());

  Future<void> _refreshInBackground() async {
    try {
      await refresh();
    } on CatalogSyncException catch (error) {
      debugPrint('Catalog refresh failed: $error');
    }
  }

  void _onConnectivityChanged() {
    if (_initialized && _connectivity.status != NetworkStatus.offline) {
      refreshInBackground();
    }
  }

  @override
  void dispose() {
    _disposed = true;
    _connectivity.removeListener(_onConnectivityChanged);
    if (_ownsClient) _client.close();
    super.dispose();
  }
}

class FakeCatalogRepository extends ChangeNotifier
    implements CatalogRepository {
  @override
  List<Shelter> get shelters => const [];

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
}
