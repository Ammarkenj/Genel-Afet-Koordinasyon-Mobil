import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../data/repositories/connectivity_repository.dart';
import '../../data/repositories/reports_repository.dart';
import '../../data/repositories/volunteer_repository.dart';
import '../../l10n/app_localizations.dart';
import '../features/report/view_models/countdown_view_model.dart';
import '../features/report/view_models/report_view_model.dart';
import 'widgets/layout.dart';

/// App-wide reactions that no single screen owns:
/// - the countdown opens full screen when a sensor triggers it and routes the user afterwards;
/// - when the network returns, queued reports and tasks are sent and one toast says how many.
class AppEvents extends StatefulWidget {
  const AppEvents({
    super.key,
    required this.router,
    required this.rootKey,
    required this.messengerKey,
    required this.child,
  });

  final GoRouter router;
  final GlobalKey<NavigatorState> rootKey;
  final GlobalKey<ScaffoldMessengerState> messengerKey;
  final Widget child;

  @override
  State<AppEvents> createState() => _AppEventsState();
}

class _AppEventsState extends State<AppEvents> {
  late final CountdownViewModel _countdown;
  late final ConnectivityRepository _net;
  late final ReportsRepository _reports;
  late final VolunteerRepository _volunteers;
  late final ReportViewModel _reportVm;

  String get _location =>
      widget.router.routerDelegate.currentConfiguration.uri.path;

  @override
  void initState() {
    super.initState();
    _countdown = context.read<CountdownViewModel>();
    _net = context.read<ConnectivityRepository>();
    _reports = context.read<ReportsRepository>();
    _volunteers = context.read<VolunteerRepository>();
    _reportVm = context.read<ReportViewModel>();
    _countdown.addListener(_onCountdown);
    _net.addListener(_onNetwork);
  }

  AppLocalizations? get _l {
    final ctx = widget.rootKey.currentContext;
    return ctx == null ? null : AppLocalizations.of(ctx);
  }

  void _onCountdown() {
    if (_countdown.active) {
      if (_location != '/countdown') widget.router.go('/countdown');
      return;
    }
    final end = _countdown.takeEnd();
    if (end == null) return;
    switch (end) {
      case CountdownEnd.cancelled:
        widget.router.go(_countdown.returnTo);
        final l = _l;
        final messenger = widget.messengerKey.currentState;
        if (l != null && messenger != null) {
          showToastOn(messenger, l.toastCdCancelled);
        }
      case CountdownEnd.sentNow:
      case CountdownEnd.sentAuto:
        final report = _countdown.sentReport;
        if (report != null) _reportVm.open(report.id);
        widget.router.go('/status');
    }
  }

  void _onNetwork() {
    final n = _reports.takeFlushedCount() + _volunteers.takeFlushedCount();
    final l = _l;
    final messenger = widget.messengerKey.currentState;
    if (n > 0 && l != null && messenger != null) {
      showToastOn(messenger, l.toastSynced(n));
    }
  }

  @override
  void dispose() {
    _countdown.removeListener(_onCountdown);
    _net.removeListener(_onNetwork);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
