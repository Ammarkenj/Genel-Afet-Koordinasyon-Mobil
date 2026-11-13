import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

import '../../domain/geo.dart';
import '../../domain/models/models.dart';
import 'location_repository.dart';

/// Assembly areas shown on the map, nearest first, with the distance from the device.
abstract class AssemblyAreasRepository implements Listenable {
  List<AssemblyArea> get areas;

  /// True for the built-in samples (tests and visual review), false for real data.
  bool get isSample;

  /// An error code when the areas could not be read (shown nowhere yet; kept for diagnosis).
  String? get problem;
}

/// The three sample areas of the prototype.
class FakeAssemblyAreasRepository extends ChangeNotifier
    implements AssemblyAreasRepository {
  @override
  final List<AssemblyArea> areas = const [
    AssemblyArea(number: 1, meters: 450, minutes: 6),
    AssemblyArea(number: 2, meters: 900, minutes: 12),
    AssemblyArea(number: 3, meters: 1400, minutes: 18),
  ];

  @override
  bool get isSample => true;

  @override
  String? get problem => null;
}

/// One area as stored in Firestore (`assemblyAreas`, written by the dashboard).
class AssemblySite {
  const AssemblySite({
    required this.number,
    required this.name,
    required this.lat,
    required this.lng,
  });

  final int number;
  final String name;
  final double lat;
  final double lng;

  /// Reads a document defensively: a malformed one is skipped (null) instead of breaking the whole list.
  static AssemblySite? tryParse(Map<String, dynamic> data) {
    final lat = data['lat'];
    final lng = data['lng'];
    if (lat is! num || lng is! num) return null;
    final number = data['number'];
    final name = data['name'];
    return AssemblySite(
      number: number is num ? number.toInt() : 0,
      name: name is String ? name : '',
      lat: lat.toDouble(),
      lng: lng.toDouble(),
    );
  }
}

/// Sorts sites nearest first and turns them into areas with distance and walking time from ([lat], [lng]).
List<AssemblyArea> areasFrom(
  Iterable<AssemblySite> sites,
  double lat,
  double lng,
) {
  final withDistance = [
    for (final s in sites) (s, distanceMeters(lat, lng, s.lat, s.lng)),
  ]..sort((a, b) => a.$2.compareTo(b.$2));
  return [
    for (final (s, m) in withDistance)
      AssemblyArea(
        number: s.number,
        name: s.name,
        meters: m.round(),
        minutes: walkMinutes(m),
      ),
  ];
}

/// Reads `assemblyAreas` live. Needs the anonymous sign-in done by the reports repository.
class FirestoreAssemblyAreasRepository extends ChangeNotifier
    implements AssemblyAreasRepository {
  FirestoreAssemblyAreasRepository({
    required this.location,
    FirebaseFirestore? firestore,
    FirebaseAuth? auth,
    this.retryEvery = const Duration(seconds: 10),
  }) : _db = firestore ?? FirebaseFirestore.instance,
       _auth = auth ?? FirebaseAuth.instance {
    unawaited(_listen());
  }

  final LocationRepository location;
  final FirebaseFirestore _db;
  final FirebaseAuth _auth;
  final Duration retryEvery;

  List<AssemblySite> _sites = const [];
  List<AssemblyArea> _areas = const [];
  String? _problem;
  bool _disposed = false;

  @override
  List<AssemblyArea> get areas => _areas;

  @override
  bool get isSample => false;

  @override
  String? get problem => _problem;

  Future<void> _listen() async {
    while (!_disposed) {
      try {
        await _auth.authStateChanges().firstWhere((u) => u != null);
        await for (final snap in _db
            .collection('assemblyAreas')
            .snapshots()) {
          _problem = null;
          _sites = [
            for (final d in snap.docs)
              ?AssemblySite.tryParse(d.data()),
          ];
          await _recompute();
        }
      } catch (e) {
        _problem = e is FirebaseException ? e.code : e.toString();
        debugPrint('assembly areas: $e');
        notifyListeners();
      }
      await Future<void>.delayed(retryEvery);
    }
  }

  Future<void> _recompute() async {
    final pos = await location.current();
    if (_disposed) return;
    _areas = areasFrom(_sites, pos.lat, pos.lng);
    notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }
}
