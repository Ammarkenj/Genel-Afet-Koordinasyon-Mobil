import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

import '../app.dart';
import 'repositories/assembly_areas_repository.dart';
import 'tools_hardware.dart';
import 'repositories/firestore_reports_repository.dart';
import 'repositories/location_repository.dart';
import 'repositories/real_connectivity_repository.dart';

/// Connects the app to Firebase (project `yasamahatti`; Android reads android/app/google-services.json).
/// If Firebase cannot start, the app still opens on the in-memory fakes so the UI stays usable.
Future<AppDependencies> buildFirebaseDependencies({
  ToolsHardware? hardware,
}) async {
  try {
    await Firebase.initializeApp();
    final location = GeolocatorLocationRepository()..warmUp();
    return AppDependencies(
      hardware: hardware,
      connectivity: RealConnectivityRepository(),
      reportsRepository: FirestoreReportsRepository(location: location),
      areasRepository: FirestoreAssemblyAreasRepository(location: location),
    );
  } catch (e) {
    debugPrint('Firebase init failed, using fakes: $e');
    return AppDependencies(hardware: hardware);
  }
}
