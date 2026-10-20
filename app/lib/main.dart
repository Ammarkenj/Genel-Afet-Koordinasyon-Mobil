import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'app.dart';
import 'domain/models/models.dart';

/// `--dart-define=LAB=false` hides the debug review button in a debug build.
const bool _lab = bool.fromEnvironment('LAB', defaultValue: kDebugMode);

void main() {
  // Review links (debug only): ?route=/status&lang=ar&theme=dark&net=offline&seed=help
  final q = _lab ? Uri.base.queryParameters : const <String, String>{};
  runApp(
    YasamHattiApp(
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
