import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'app.dart';
import 'data/firebase_bootstrap.dart';
import 'data/tools_hardware.dart';
import 'domain/models/models.dart';

/// `--dart-define=LAB=false` hides the debug review button in a debug build.
const bool _lab = bool.fromEnvironment('LAB', defaultValue: kDebugMode);

/// `--dart-define=BACKEND=firebase` stores reports in Cloud Firestore (the operations dashboard reads them).
const String _backend = String.fromEnvironment('BACKEND');

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Real siren and flashlight on the phone; the web build (visual review) keeps the silent stand-in.
  final hardware = kIsWeb ? null : PlatformToolsHardware();
  final deps = _backend == 'firebase'
      ? await buildFirebaseDependencies(hardware: hardware)
      : (hardware == null ? null : AppDependencies(hardware: hardware));
  // Review links (debug only): ?route=/status&lang=ar&theme=dark&net=offline&seed=help
  final q = _lab ? Uri.base.queryParameters : const <String, String>{};
  runApp(
    YasamHattiApp(
      dependencies: deps,
      lab: _lab && q['lab'] != '0',
      initialLocation: q['route'] ?? '/onboarding',
      initialLanguage: q['lang'] == 'ar' ? 'ar' : 'tr',
      initialThemeMode: switch (q['theme']) {
        'dark' => ThemeMode.dark,
        'light' => ThemeMode.light,
        _ => ThemeMode.system,
      },
      seed: q['seed'],
      initialNetwork: NetworkStatus.values.firstWhere(
        (n) => n.name == q['net'],
        orElse: () => NetworkStatus.online,
      ),
    ),
  );
}
