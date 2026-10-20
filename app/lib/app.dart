import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'data/repositories/connectivity_repository.dart';
import 'data/repositories/reports_repository.dart';
import 'data/repositories/volunteer_repository.dart';
import 'domain/models/models.dart';
import 'l10n/app_localizations.dart';
import 'ui/core/app_events.dart';
import 'ui/core/lab_panel.dart';
import 'ui/core/theme/app_theme.dart';
import 'ui/core/widgets/bottom_nav.dart';
import 'ui/features/donate/view_models/donate_view_model.dart';
import 'ui/features/donate/views/donate_view.dart';
import 'ui/features/home/views/home_view.dart';
import 'ui/features/login/view_models/login_view_model.dart';
import 'ui/features/login/views/login_view.dart';
import 'ui/features/map/view_models/map_view_model.dart';
import 'ui/features/map/views/map_view.dart';
import 'ui/features/onboarding/view_models/onboarding_view_model.dart';
import 'ui/features/onboarding/views/onboarding_view.dart';
import 'ui/features/profile/view_models/settings_view_model.dart';
import 'ui/features/profile/views/profile_view.dart';
import 'ui/features/report/view_models/countdown_view_model.dart';
import 'ui/features/report/view_models/report_view_model.dart';
import 'ui/features/report/views/countdown_view.dart';
import 'ui/features/report/views/select_view.dart';
import 'ui/features/report/views/status_view.dart';
import 'ui/features/tools/view_models/tools_view_model.dart';
import 'ui/features/tools/views/tools_view.dart';
import 'ui/features/volunteer/view_models/volunteer_view_model.dart';
import 'ui/features/volunteer/views/volunteer_hub_view.dart';
import 'ui/features/volunteer/views/volunteer_join_view.dart';
import 'ui/features/volunteer/views/volunteer_need_view.dart';
import 'ui/features/volunteer/views/volunteer_task_view.dart';

/// The repositories behind the app. Today they are in-memory fakes with sample data;
/// the real Room/Drift + API implementations replace them without touching any view.
class AppDependencies {
  AppDependencies({FakeConnectivityRepository? connectivity})
    : connectivity = connectivity ?? FakeConnectivityRepository() {
    reports = FakeReportsRepository(this.connectivity);
    volunteers = FakeVolunteerRepository(this.connectivity);
  }

  final FakeConnectivityRepository connectivity;
  late final FakeReportsRepository reports;
  late final FakeVolunteerRepository volunteers;
}

class YasamHattiApp extends StatefulWidget {
  const YasamHattiApp({
    super.key,
    this.lab = false,
    this.initialLocation = '/onboarding',
    this.dependencies,
    this.initialLanguage = 'tr',
    this.initialThemeMode = ThemeMode.system,
    this.initialNetwork = NetworkStatus.online,
    this.seed,
  });

  /// Shows the review/lab button (network, sensor simulators, AFAD alert). Debug builds only.
  final bool lab;
  final String initialLocation;
  final AppDependencies? dependencies;

  /// Starting language, theme and network, so a review link can open straight into a state
  /// (debug builds read them from the page URL, see main.dart).
  final String initialLanguage;
  final ThemeMode initialThemeMode;
  final NetworkStatus initialNetwork;

  /// Review links only: puts the app into a state that needs data (help, safe, vol, fall, crash, quake).
  final String? seed;

  @override
  State<YasamHattiApp> createState() => _YasamHattiAppState();
}

class _YasamHattiAppState extends State<YasamHattiApp> {
  final _rootKey = GlobalKey<NavigatorState>();
  final _messengerKey = GlobalKey<ScaffoldMessengerState>();
  late final AppDependencies _deps = widget.dependencies ?? AppDependencies();
  late final GoRouter _router = _buildRouter();

  @override
  void initState() {
    super.initState();
    _deps.connectivity.setStatus(widget.initialNetwork);
    if (widget.seed != null) {
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => _applySeed(widget.seed!),
      );
    }
  }

  void _applySeed(String seed) {
    final context = _rootKey.currentContext;
    if (context == null) return;
    final reports = context.read<ReportViewModel>();
    switch (seed) {
      case 'help':
        reports
          ..sendHelp(IncidentType.quake)
          ..setInjured(true);
      case 'safe':
        reports.sendSafe();
      case 'vol':
        context.read<VolunteerViewModel>()
          ..setRole(VolunteerRole.rescue)
          ..register()
          ..openNeed(NeedId.water)
          ..accept();
      case 'fall' || 'crash' || 'quake':
        context.read<CountdownViewModel>().start(
          CountdownCause.values.byName(seed),
          autoDetectEnabled: true,
        );
    }
  }

  GoRouter _buildRouter() {
    return GoRouter(
      navigatorKey: _rootKey,
      initialLocation: widget.initialLocation,
      routes: [
        GoRoute(path: '/onboarding', builder: (_, _) => const OnboardingView()),
        GoRoute(path: '/login', builder: (_, _) => const LoginView()),
        GoRoute(path: '/countdown', builder: (_, _) => const CountdownView()),
        ShellRoute(
          builder: (_, state, child) =>
              AppShell(location: state.uri.path, child: child),
          routes: [
            GoRoute(path: '/home', builder: (_, _) => const HomeView()),
            GoRoute(path: '/select', builder: (_, _) => const SelectView()),
            GoRoute(path: '/status', builder: (_, _) => const StatusView()),
            GoRoute(path: '/map', builder: (_, _) => const MapView()),
            GoRoute(path: '/tools', builder: (_, _) => const ToolsView()),
            GoRoute(path: '/donate', builder: (_, _) => const DonateView()),
            GoRoute(path: '/profile', builder: (_, _) => const ProfileView()),
            GoRoute(path: '/vol', builder: (_, _) => const VolunteerHubView()),
            GoRoute(
              path: '/vol/join',
              builder: (_, _) => const VolunteerJoinView(),
            ),
            GoRoute(
              path: '/vol/need',
              builder: (_, _) => const VolunteerNeedView(),
            ),
            GoRoute(
              path: '/vol/task',
              builder: (_, _) => const VolunteerTaskView(),
            ),
          ],
        ),
      ],
    );
  }

  @override
  void dispose() {
    _router.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ListenableProvider<ConnectivityRepository>.value(
          value: _deps.connectivity,
        ),
        ListenableProvider<ReportsRepository>.value(value: _deps.reports),
        ListenableProvider<VolunteerRepository>.value(value: _deps.volunteers),
        ChangeNotifierProvider(
          create: (_) => SettingsViewModel(
            locale: Locale(widget.initialLanguage),
            themeMode: widget.initialThemeMode,
          ),
        ),
        ChangeNotifierProvider(
          create: (c) => ReportViewModel(c.read<ReportsRepository>()),
        ),
        ChangeNotifierProvider(
          create: (c) => CountdownViewModel(c.read<ReportsRepository>()),
        ),
        ChangeNotifierProvider(create: (_) => ToolsViewModel()),
        ChangeNotifierProvider(create: (_) => OnboardingViewModel()),
        ChangeNotifierProvider(create: (_) => LoginViewModel()),
        ChangeNotifierProvider(create: (_) => MapViewModel()),
        ChangeNotifierProvider(create: (_) => DonateViewModel()),
        ChangeNotifierProvider(
          create: (c) => VolunteerViewModel(c.read<VolunteerRepository>()),
        ),
      ],
      child: Consumer<SettingsViewModel>(
        builder: (context, settings, _) => MaterialApp.router(
          title: 'YaşamHattı',
          debugShowCheckedModeBanner: false,
          scaffoldMessengerKey: _messengerKey,
          routerConfig: _router,
          locale: settings.locale,
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          themeMode: settings.themeMode,
          theme: buildTheme(Brightness.light, arabic: settings.isArabic),
          darkTheme: buildTheme(Brightness.dark, arabic: settings.isArabic),
          builder: (context, child) => AppEvents(
            router: _router,
            rootKey: _rootKey,
            messengerKey: _messengerKey,
            child: Stack(
              children: [
                Positioned.fill(child: child ?? const SizedBox.shrink()),
                if (widget.lab)
                  LabButton(
                    router: _router,
                    rootKey: _rootKey,
                    messengerKey: _messengerKey,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
