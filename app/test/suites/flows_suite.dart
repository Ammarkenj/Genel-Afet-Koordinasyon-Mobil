import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yasamhatti/domain/models/models.dart';
import 'package:yasamhatti/l10n/app_localizations_tr.dart';
import 'package:yasamhatti/ui/features/donate/view_models/donate_view_model.dart';
import 'package:yasamhatti/ui/features/login/view_models/login_view_model.dart';
import 'package:yasamhatti/ui/features/profile/view_models/settings_view_model.dart';
import 'package:yasamhatti/ui/features/report/view_models/countdown_view_model.dart';
import 'package:yasamhatti/ui/features/volunteer/view_models/volunteer_view_model.dart';

import '../support/test_app.dart';

/// User flows against the in-memory repositories: what a person does, and what they must see.
void flowsSuite() {
  TestWidgetsFlutterBinding.ensureInitialized();
  final tr = AppLocalizationsTr();

  setUpAll(loadAppFonts);

  group('reporting', () {
    testApp('help takes two taps and the report is sent at once', (
      tester,
    ) async {
      final app = await pumpApp(tester);
      await app.tapText(tr.homeHelp);
      expect(find.text(tr.selectTitle), findsOneWidget);
      await app.tapText(tr.typeQuake);
      expect(find.text(tr.statusSentTitle), findsOneWidget);
      expect(app.deps.reports.reports, hasLength(1));
      expect(app.deps.reports.reports.single.type, IncidentType.quake);
      expect(app.deps.reports.reports.single.state, DeliveryState.sent);
    });

    testApp('the fall type exists and is reported as a fall', (tester) async {
      final app = await pumpApp(tester);
      await app.tapText(tr.homeHelp);
      await app.tapText(tr.typeFall);
      expect(app.deps.reports.reports.single.type, IncidentType.fall);
    });

    testApp(
      'offline: the report is saved, not an error, and is sent when the network returns',
      (tester) async {
        final app = await pumpApp(tester);
        app.deps.connectivity.setStatus(NetworkStatus.offline);
        await tester.pumpAndSettle();
        await app.tapText(tr.homeHelp);
        await app.tapText(tr.typeFire);
        expect(find.text(tr.statusQueuedTitle), findsOneWidget);
        expect(find.text(tr.statusQueuedDesc), findsOneWidget);
        expect(app.deps.reports.reports.single.state, DeliveryState.queued);

        app.deps.connectivity.setStatus(NetworkStatus.online);
        await tester.pumpAndSettle();
        expect(find.text(tr.statusSentTitle), findsOneWidget);
        expect(find.text(tr.toastSynced(1)), findsOneWidget);
      },
    );

    testApp('weak network: sending, then sent', (tester) async {
      final app = await pumpApp(tester);
      app.deps.connectivity.setStatus(NetworkStatus.weak);
      await tester.pumpAndSettle();
      await app.tapText(tr.homeHelp);
      await app.tapText(tr.typeCrash);
      expect(find.text(tr.statusSendingTitle), findsOneWidget);
      await tester.pump(const Duration(seconds: 3));
      await tester.pumpAndSettle();
      expect(find.text(tr.statusSentTitle), findsOneWidget);
    });

    testApp('"I am safe" sends a safe report', (tester) async {
      final app = await pumpApp(tester);
      await app.tapText(tr.homeSafe);
      expect(find.text(tr.statusSentTitle), findsOneWidget);
      expect(app.deps.reports.reports.single.kind, ReportKind.safe);
    });

    testApp(
      'a mistaken report is undone after sending; the safe answer comes first',
      (tester) async {
        final app = await pumpApp(tester);
        await app.tapText(tr.homeHelp);
        await app.tapText(tr.typeQuake);
        await app.tapText(tr.statusUndo);
        expect(find.text(tr.confirmTitle), findsOneWidget);
        await app.tapText(tr.confirmNo);
        expect(app.deps.reports.reports, hasLength(1));
        await app.tapText(tr.statusUndo);
        await app.tapText(tr.confirmYes);
        expect(app.deps.reports.reports, isEmpty);
        expect(find.text(tr.homePrompt), findsOneWidget);
      },
    );

    testApp('details are optional and answered after the report is sent', (
      tester,
    ) async {
      final app = await pumpApp(tester);
      await app.tapText(tr.homeHelp);
      await app.tapText(tr.typeQuake);
      await app.tapText(tr.commonYes, last: false);
      expect(app.deps.reports.reports.single.injured, isTrue);
      await app.tap(find.bySemanticsLabel(tr.statusIncrease));
      expect(app.deps.reports.reports.single.people, 2);
    });
  });

  group('countdown', () {
    testApp(
      'a fall opens the countdown with its own title; cancelling sends nothing',
      (tester) async {
        final app = await pumpApp(tester);
        expect(
          app.read<CountdownViewModel>().start(
            CountdownCause.fall,
            autoDetectEnabled: true,
          ),
          isTrue,
        );
        await tester.pumpAndSettle(const Duration(milliseconds: 100));
        expect(find.text(tr.cdFall), findsOneWidget);
        expect(find.text('60'), findsOneWidget);
        await app.tapText(tr.cdCancel);
        expect(find.text(tr.homePrompt), findsOneWidget);
        expect(app.deps.reports.reports, isEmpty);
      },
    );

    testApp('unanswered, the countdown sends an automatic help report', (
      tester,
    ) async {
      final app = await pumpApp(tester);
      final countdown = app.read<CountdownViewModel>();
      countdown.setSpeed(10);
      countdown.start(CountdownCause.crash, autoDetectEnabled: true);
      await tester.pump(const Duration(seconds: 7));
      await tester.pumpAndSettle();
      final report = app.deps.reports.reports.single;
      expect(report.auto, isTrue);
      expect(report.type, IncidentType.crash);
      expect(find.text(tr.statusAuto), findsOneWidget);
    });

    testApp('"send help now" sends a report that is not marked automatic', (
      tester,
    ) async {
      final app = await pumpApp(tester);
      app.read<CountdownViewModel>().start(
        CountdownCause.quake,
        autoDetectEnabled: true,
      );
      await tester.pumpAndSettle(const Duration(milliseconds: 100));
      await app.tapText(tr.cdNow);
      expect(app.deps.reports.reports.single.auto, isFalse);
    });

    testApp('with automatic detection off, no countdown starts', (
      tester,
    ) async {
      final app = await pumpApp(tester);
      app.read<SettingsViewModel>().setAutoDetect(false);
      expect(
        app.read<CountdownViewModel>().start(
          CountdownCause.fall,
          autoDetectEnabled: false,
        ),
        isFalse,
      );
      expect(app.read<CountdownViewModel>().active, isFalse);
    });

    testApp('the system Back button does not cancel the countdown silently', (
      tester,
    ) async {
      final app = await pumpApp(tester);
      app.read<CountdownViewModel>().start(
        CountdownCause.quake,
        autoDetectEnabled: true,
      );
      await tester.pumpAndSettle(const Duration(milliseconds: 100));
      await tester.binding.handlePopRoute();
      await tester.pump(const Duration(milliseconds: 200));
      expect(find.text(tr.cdCancel), findsOneWidget);
      expect(app.read<CountdownViewModel>().active, isTrue);
      app.read<CountdownViewModel>().cancel();
      await tester.pumpAndSettle();
    });
  });

  group('onboarding and login', () {
    testApp('continuing without KVKK consent shows the error and stays', (
      tester,
    ) async {
      final app = await pumpApp(tester, location: '/onboarding');
      await app.tapText(tr.commonContinue);
      await app.tapText(tr.commonContinue);
      expect(find.text(tr.onbKvkkNeeded), findsOneWidget);
      await app.tap(find.textContaining('KVKK'));
      await app.tapText(tr.commonContinue);
      expect(find.text(tr.loginTitle), findsWidgets);
    });

    testApp(
      'invalid phone shows an inline error; a valid one asks for the code; guest continues',
      (tester) async {
        final app = await pumpApp(tester, location: '/login');
        await app.type('123');
        await app.tapText(tr.loginSendCode);
        expect(find.text(tr.loginPhoneError), findsOneWidget);
        await app.type('532 111 22 33');
        await app.tapText(tr.loginSendCode);
        final login = app.read<LoginViewModel>();
        expect(
          find.text(tr.loginCode),
          findsOneWidget,
          reason:
              'step=${login.step} error=${login.error} phone="${login.phone}"',
        );
        await app.type('12');
        await app.tapText(tr.loginSubmit, last: true);
        expect(find.text(tr.loginCodeError), findsOneWidget);
        await app.type('123456');
        await app.tapText(tr.loginSubmit, last: true);
        expect(find.text(tr.homePrompt), findsOneWidget);
      },
    );

    testApp(
      'emergency features do not need a login ("continue without signing up")',
      (tester) async {
        final app = await pumpApp(tester, location: '/login');
        await app.tapText(tr.loginGuest);
        expect(find.text(tr.homeHelp), findsOneWidget);
      },
    );
  });

  group('donation', () {
    testApp('an amount below the minimum is refused under the field', (
      tester,
    ) async {
      final app = await pumpApp(tester, location: '/donate');
      await app.type('5');
      await app.tapText(tr.donateConfirm);
      expect(find.text(tr.donateCustomError), findsOneWidget);
    });

    test('confirming enters the processing state at once and a second press changes nothing', () async {
      final vm = DonateViewModel(
        processingDelay: const Duration(milliseconds: 30),
      );
      vm.setCustom('75');
      expect(vm.confirm(), isTrue);
      expect(vm.processing, isTrue);
      expect(vm.receipt, isNull);
      vm.confirm();
      await Future<void>.delayed(const Duration(milliseconds: 80));
      expect(vm.processing, isFalse);
      expect(vm.receipt, startsWith('YH-'));
      expect(vm.paid, 75);
      vm.dispose();
    });

    testApp('a valid amount shows processing once, then the receipt', (
      tester,
    ) async {
      final app = await pumpApp(tester, location: '/donate');
      await app.type('75');
      await app.tapText(tr.donateConfirm);
      await tester.pump(const Duration(seconds: 2));
      await tester.pumpAndSettle();
      final donate = app.read<DonateViewModel>();
      expect(
        find.text(tr.donateDoneTitle),
        findsOneWidget,
        reason:
            'custom="${donate.custom}" error=${donate.error} processing=${donate.processing} receipt=${donate.receipt}',
      );
      expect(app.read<DonateViewModel>().paid, 75);
    });

    testApp(
      'offline: the donate button is disabled and the reason is written',
      (tester) async {
        final app = await pumpApp(tester, location: '/donate');
        app.deps.connectivity.setStatus(NetworkStatus.offline);
        await tester.pumpAndSettle();
        expect(find.text(tr.donateOffline), findsOneWidget);
        final semantics = tester.getSemantics(
          find.bySemanticsLabel(tr.donateConfirm),
        );
        expect(semantics, isSemantics(isEnabled: false));
      },
    );
  });

  group('volunteer', () {
    testApp('sign up and accept a need', (tester) async {
      final app = await pumpApp(tester);
      await app.tapText(tr.volEntryJoin);
      expect(find.text(tr.volJoinTitle), findsWidgets);
      await app.tapText(tr.volRoleRescue);
      await app.tapText(tr.volJoinBtn, last: true);
      expect(find.text(tr.volHubTitle), findsOneWidget);
      expect(app.read<VolunteerViewModel>().role, VolunteerRole.rescue);

      await app.tapText(tr.needWater);
      expect(find.text(tr.volNeedTitle), findsOneWidget);
      await app.tapText(tr.volAccept);
      expect(find.text(tr.volTaskSent), findsOneWidget);
    });

    testApp('declining the completion confirmation keeps the task open', (
      tester,
    ) async {
      final app = await pumpApp(tester, location: '/vol');
      app.read<VolunteerViewModel>()
        ..register()
        ..openNeed(NeedId.shelter)
        ..accept();
      await app.go('/vol/task');
      await app.tapText(tr.volComplete);
      expect(find.text(tr.volDoneConfirmTitle), findsOneWidget);
      await app.tapText(tr.volDoneNo);
      expect(app.deps.volunteers.task!.done, isFalse);
      expect(find.text(tr.volDoneConfirmTitle), findsNothing);
    });

    testApp('confirming the completion of a task completes it', (tester) async {
      final app = await pumpApp(tester, location: '/vol');
      app.read<VolunteerViewModel>()
        ..register()
        ..openNeed(NeedId.shelter)
        ..accept();
      await app.go('/vol/task');
      await app.tapText(tr.volComplete);
      await app.tapText(tr.volDoneYes);
      expect(app.deps.volunteers.task!.done, isTrue);
      expect(find.text(tr.volTaskDone), findsOneWidget);
    });

    testApp(
      'offline: accepting is saved as waiting and sent when the network returns',
      (tester) async {
        final app = await pumpApp(tester, location: '/vol');
        app.read<VolunteerViewModel>().register();
        app.deps.connectivity.setStatus(NetworkStatus.offline);
        await tester.pumpAndSettle();
        await app.tapText(tr.needWater);
        await app.tapText(tr.volAccept);
        expect(find.text(tr.volTaskQueued), findsOneWidget);
        expect(app.deps.volunteers.task!.state, DeliveryState.queued);
        app.deps.connectivity.setStatus(NetworkStatus.online);
        await tester.pumpAndSettle();
        expect(app.deps.volunteers.task!.state, DeliveryState.sent);
      },
    );

    testApp(
      'while another task is active, accepting is disabled and the reason is written',
      (tester) async {
        final app = await pumpApp(tester, location: '/vol');
        app.read<VolunteerViewModel>().register();
        app.deps.volunteers.accept(NeedId.water);
        app.read<VolunteerViewModel>().openNeed(NeedId.aid);
        await app.go('/vol/need');
        expect(find.text(tr.volBusy), findsOneWidget);
        final semantics = tester.getSemantics(
          find.bySemanticsLabel(tr.volAccept),
        );
        expect(semantics, isSemantics(isEnabled: false));
      },
    );

    testApp('unavailable: the needs list is hidden and the reason is written', (
      tester,
    ) async {
      final app = await pumpApp(tester, location: '/vol');
      app.read<VolunteerViewModel>().register();
      app.read<VolunteerViewModel>().setAvailable(false);
      await tester.pumpAndSettle();
      expect(find.text(tr.volUnavailable), findsOneWidget);
      expect(find.text(tr.needWater), findsNothing);
    });
  });

  group('settings', () {
    testApp('choosing Arabic switches the app to right-to-left', (
      tester,
    ) async {
      final app = await pumpApp(tester, location: '/profile');
      await app.tapText('العربية');
      final context = tester.element(find.byType(Scaffold).first);
      expect(Directionality.of(context), TextDirection.rtl);
      expect(app.read<SettingsViewModel>().isArabic, isTrue);
    });
  });
}
