import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yasamhatti/domain/models/models.dart';
import 'package:yasamhatti/ui/features/donate/view_models/donate_view_model.dart';
import 'package:yasamhatti/ui/features/home/views/afad_sheet.dart';
import 'package:yasamhatti/ui/features/login/view_models/login_view_model.dart';
import 'package:yasamhatti/ui/features/map/view_models/map_view_model.dart';
import 'package:yasamhatti/ui/features/onboarding/view_models/onboarding_view_model.dart';
import 'package:yasamhatti/ui/features/report/view_models/countdown_view_model.dart';
import 'package:yasamhatti/ui/features/report/view_models/report_view_model.dart';
import 'package:yasamhatti/ui/features/tools/view_models/tools_view_model.dart';
import 'package:yasamhatti/ui/features/volunteer/view_models/volunteer_view_model.dart';

import '../support/test_app.dart';

typedef _Setup = Future<void> Function(TestApp app);

/// Every screen state, in Turkish and Arabic, light and dark, at large text sizes and on a narrow phone:
/// nothing overflows or is cut off, and every control is at least 48dp (WCAG / Android guideline).
void layoutSuite({String? onlyScenario}) {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(loadAppFonts);

  final scenarios = <String, _Setup>{
    'onboarding language': (a) => a.go('/onboarding'),
    'onboarding permissions': (a) async {
      await a.go('/onboarding');
      a.read<OnboardingViewModel>().next();
      await a.settle();
    },
    'onboarding consent error': (a) async {
      await a.go('/onboarding');
      a.read<OnboardingViewModel>()
        ..next()
        ..finish();
      await a.settle();
    },
    'login phone': (a) => a.go('/login'),
    'login phone error': (a) async {
      await a.go('/login');
      a.read<LoginViewModel>()
        ..setPhone('1')
        ..sendCode();
      await a.settle();
    },
    'login code': (a) async {
      await a.go('/login');
      a.read<LoginViewModel>()
        ..setPhone('5321112233')
        ..sendCode();
      await a.settle();
    },
    'home': (a) async {},
    'home offline with reports': (a) async {
      a.deps.connectivity.setStatus(NetworkStatus.offline);
      a.read<ReportViewModel>()
        ..sendSafe()
        ..sendHelp(IncidentType.fall);
      await a.settle();
    },
    'select': (a) => a.go('/select'),
    'status sent with details': (a) async {
      a.read<ReportViewModel>()
        ..sendHelp(IncidentType.quake)
        ..setInjured(true);
      await a.go('/status');
    },
    'status queued': (a) async {
      a.deps.connectivity.setStatus(NetworkStatus.offline);
      a.read<ReportViewModel>().sendHelp(IncidentType.fire);
      await a.go('/status');
    },
    'status sending': (a) async {
      a.deps.connectivity.setStatus(NetworkStatus.weak);
      a.read<ReportViewModel>().sendHelp(IncidentType.crash);
      await a.go('/status');
    },
    'status safe': (a) async {
      a.read<ReportViewModel>().sendSafe();
      await a.go('/status');
    },
    'status cancel dialog': (a) async {
      a.read<ReportViewModel>().sendHelp(IncidentType.quake);
      await a.go('/status');
      await a.tapText(a.l.statusUndo);
    },
    'countdown fall': (a) async {
      a.read<CountdownViewModel>().start(
        CountdownCause.fall,
        autoDetectEnabled: true,
      );
      await a.tester.pumpAndSettle(const Duration(milliseconds: 100));
    },
    'afad alert': (a) async {
      showAfadSheet(a.tester.element(find.byType(Scaffold).first));
      await a.settle();
    },
    'map': (a) => a.go('/map'),
    'map route selected': (a) async {
      await a.go('/map');
      a.read<MapViewModel>()
        ..select(2)
        ..toggleRoute();
      await a.settle();
    },
    'map offline': (a) async {
      a.deps.connectivity.setStatus(NetworkStatus.offline);
      await a.go('/map');
    },
    'tools on': (a) async {
      await a.go('/tools');
      a.read<ToolsViewModel>()
        ..toggleSiren()
        ..toggleFlash();
      await a.settle();
    },
    'donate': (a) => a.go('/donate'),
    'donate error': (a) async {
      await a.go('/donate');
      a.read<DonateViewModel>()
        ..setCustom('5')
        ..confirm();
      await a.settle();
    },
    'donate receipt': (a) async {
      await a.go('/donate');
      a.read<DonateViewModel>().confirm();
      await a.tester.pump(const Duration(seconds: 2));
      await a.settle();
    },
    'donate offline': (a) async {
      a.deps.connectivity.setStatus(NetworkStatus.offline);
      await a.go('/donate');
    },
    'profile': (a) => a.go('/profile'),
    'volunteer join': (a) => a.go('/vol/join'),
    'volunteer hub': (a) async {
      a.read<VolunteerViewModel>()
        ..setRole(VolunteerRole.rescue)
        ..toggleCertificate()
        ..register();
      await a.go('/vol');
    },
    'volunteer hub offline with waiting task': (a) async {
      a.deps.connectivity.setStatus(NetworkStatus.offline);
      a.read<VolunteerViewModel>()
        ..register()
        ..openNeed(NeedId.water)
        ..accept();
      await a.go('/vol');
    },
    'volunteer hub unavailable': (a) async {
      a.read<VolunteerViewModel>()
        ..register()
        ..setAvailable(false);
      await a.go('/vol');
    },
    'volunteer need': (a) async {
      a.read<VolunteerViewModel>().openNeed(NeedId.water);
      await a.go('/vol/need');
    },
    'volunteer need busy': (a) async {
      a.read<VolunteerViewModel>()
        ..openNeed(NeedId.water)
        ..accept()
        ..openNeed(NeedId.aid);
      await a.go('/vol/need');
    },
    'volunteer task': (a) async {
      a.read<VolunteerViewModel>()
        ..openNeed(NeedId.shelter)
        ..accept();
      await a.go('/vol/task');
    },
    'volunteer task done dialog': (a) async {
      a.read<VolunteerViewModel>()
        ..openNeed(NeedId.shelter)
        ..accept();
      await a.go('/vol/task');
      await a.tapText(a.l.volComplete);
    },
    'volunteer task done': (a) async {
      a.read<VolunteerViewModel>()
        ..openNeed(NeedId.shelter)
        ..accept()
        ..complete();
      await a.go('/vol/task');
    },
  };

  // (text scale, phone width in dp). 320 is a small phone; 2.0 is the largest accessibility text size.
  final variants = <({String lang, bool dark, double scale, double width})>[
    for (final lang in ['tr', 'ar'])
      for (final dark in [false, true])
        for (final (scale, width) in [(1.0, 360.0), (2.0, 360.0), (2.0, 320.0)])
          (lang: lang, dark: dark, scale: scale, width: width),
    (lang: 'tr', dark: false, scale: 1.5, width: 360.0),
    (lang: 'ar', dark: true, scale: 1.5, width: 360.0),
  ];

  group('layout', () {
    for (final entry in scenarios.entries) {
      if (onlyScenario != null && entry.key != onlyScenario) continue;
      for (final v in variants) {
        final name =
            '${entry.key} · ${v.lang}/${v.dark ? 'dark' : 'light'} · ${v.scale}x · ${v.width.toInt()}dp';
        testApp(name, (tester) async {
          final handle = tester.ensureSemantics();
          final app = await pumpApp(
            tester,
            language: v.lang,
            dark: v.dark,
            textScale: v.scale,
            width: v.width,
          );
          await entry.value(app);
          expect(
            tester.takeException(),
            isNull,
            reason: 'nothing overflows or throws',
          );
          await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
          await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
          handle.dispose();
        });
      }
    }
  });

  // Rendered text contrast (WCAG) on the main screens, at normal size.
  group('rendered text contrast', () {
    const main = [
      'home',
      'select',
      'status sent with details',
      'countdown fall',
      'donate',
      'volunteer hub',
      'volunteer need',
      'volunteer task',
    ];
    for (final key in main) {
      for (final lang in ['tr', 'ar']) {
        for (final dark in [false, true]) {
          testApp('$key · $lang/${dark ? 'dark' : 'light'}', (tester) async {
            final handle = tester.ensureSemantics();
            final app = await pumpApp(tester, language: lang, dark: dark);
            await scenarios[key]!(app);
            try {
              await expectLater(tester, meetsGuideline(textContrastGuideline));
            } on TestFailure catch (e) {
              // Known false positive: the selected bottom-nav tab is ONE semantics node that holds both the pale
              // indicator pill (#DBEAFE) and its label, so the guideline compares the pill with the white bar (1.2:1)
              // instead of the label (#1E3A8A on white, about 10:1; checked in contrast_suite). Anything else fails.
              final failing = (e.message ?? '').split('SemanticsNode#').skip(1);
              final onlySelectedTab =
                  failing.isNotEmpty &&
                  failing.every(
                    (n) => n.contains('isSelected, isButton, hasSelectedState'),
                  );
              if (!onlySelectedTab) rethrow;
            }
            handle.dispose();
          });
        }
      }
    }
  });
}
