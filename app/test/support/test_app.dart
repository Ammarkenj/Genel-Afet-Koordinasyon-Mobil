import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show FontLoader, rootBundle;
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:yasamhatti/app.dart';
import 'package:yasamhatti/l10n/app_localizations.dart';
import 'package:yasamhatti/l10n/app_localizations_ar.dart';
import 'package:yasamhatti/l10n/app_localizations_tr.dart';
import 'package:yasamhatti/ui/features/profile/view_models/settings_view_model.dart';

/// Loads the bundled Roboto / Noto Sans Arabic so tests measure real text widths (not the 1em "Ahem" test font).
Future<void> loadAppFonts() async {
  for (final family in ['Roboto', 'NotoSansArabic']) {
    final loader = FontLoader(family);
    for (final weight in ['400Regular', '500Medium', '700Bold', '900Black']) {
      loader.addFont(rootBundle.load('assets/fonts/${family}_$weight.ttf'));
    }
    await loader.load();
  }
}

/// The running app plus quick access to its view models, repositories and router.
class TestApp {
  TestApp(this.tester, this.deps, this.l);

  final WidgetTester tester;
  final AppDependencies deps;

  /// The strings of the language the app is showing (finders must use these, not Turkish literals).
  final AppLocalizations l;

  BuildContext get _context => tester.element(find.byType(MaterialApp));

  T read<T>() => Provider.of<T>(_context, listen: false);

  GoRouter get router =>
      GoRouter.of(tester.element(find.byType(Scaffold).first));

  Future<void> go(String path) async {
    router.go(path);
    await tester.pumpAndSettle();
  }

  Future<void> settle() => tester.pumpAndSettle();

  /// Focuses the only text field, then types. (On the web, typing needs the field focused first.)
  Future<void> type(String text) async {
    await tester.tap(find.byType(TextField));
    await tester.pump();
    await tester.enterText(find.byType(TextField), text);
    await tester.pumpAndSettle();
  }

  /// Scrolls the target into view, taps it and waits for the UI to settle.
  Future<void> tap(Finder finder) async {
    await tester.ensureVisible(finder);
    await tester.pump();
    await tester.tap(finder);
    await tester.pumpAndSettle();
  }

  Future<void> tapText(String text, {bool last = false}) {
    final finder = find.text(text);
    return tap(last ? finder.last : finder.first);
  }
}

Future<TestApp> pumpApp(
  WidgetTester tester, {
  String location = '/home',
  String language = 'tr',
  bool dark = false,
  double textScale = 1,
  double width = 360,
  double height = 800,
  AppDependencies? dependencies,
}) async {
  tester.view.physicalSize = Size(width, height);
  tester.view.devicePixelRatio = 1;
  tester.platformDispatcher.textScaleFactorTestValue = textScale;
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
    tester.platformDispatcher.clearTextScaleFactorTestValue();
  });

  final deps = dependencies ?? AppDependencies();
  await tester.pumpWidget(
    YasamHattiApp(initialLocation: location, dependencies: deps),
  );
  await tester.pumpAndSettle();

  final app = TestApp(
    tester,
    deps,
    language == 'ar' ? AppLocalizationsAr() : AppLocalizationsTr(),
  );
  final settings = app.read<SettingsViewModel>();
  settings.setLanguage(language);
  settings.setThemeMode(dark ? ThemeMode.dark : ThemeMode.light);
  await tester.pumpAndSettle();
  return app;
}

/// Like [testWidgets], but Flutter errors raised while building or laying out are added to the failure text,
/// so the reason is visible in the test report (including runs in a browser, where the console is not shown).
void testApp(
  String description,
  Future<void> Function(WidgetTester tester) body,
) {
  testWidgets(description, (tester) async {
    final errors = <String>[];
    final previous = FlutterError.onError;
    FlutterError.onError = (details) {
      final e = details.exception;
      final text = e is FlutterError
          ? e.toStringDeep()
          : details.exceptionAsString();
      final more =
          details.informationCollector
              ?.call()
              .map((n) => n.toStringDeep())
              .join('\n') ??
          '';
      final all = '$text\n$more';
      errors.add(all.length > 2200 ? '${all.substring(0, 2200)}...' : all);
    };
    Object? thrown;
    try {
      await body(tester);
    } catch (e) {
      thrown = e;
    } finally {
      FlutterError.onError = previous;
    }
    if (errors.isNotEmpty) {
      final stopped = thrown == null
          ? ''
          : 'Test stopped with: ${thrown.toString().split('\n').first}\n';
      fail(
        '${stopped}Flutter errors (${errors.length}):\n${errors.take(3).join('\n---\n')}',
      );
    }
    if (thrown != null) throw thrown;
  });
}
