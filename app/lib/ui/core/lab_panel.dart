import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../data/repositories/connectivity_repository.dart';
import '../../domain/models/models.dart';
import '../../l10n/app_localizations.dart';
import '../features/home/views/afad_sheet.dart';
import '../features/profile/view_models/settings_view_model.dart';
import '../features/report/view_models/countdown_view_model.dart';
import 'labels.dart';
import 'theme/app_colors.dart';
import 'theme/app_theme.dart';
import 'theme/tokens.dart';
import 'widgets/app_button.dart';
import 'widgets/app_icon.dart';
import 'widgets/layout.dart';
import 'widgets/parts.dart';
import 'widgets/segmented.dart';

/// Debug-only review button. The real sensors, network and AFAD feed do not exist yet, so this opens a panel to
/// switch the network state, trigger the shake / crash / fall countdown and show the AFAD alert.
class LabButton extends StatelessWidget {
  const LabButton({
    super.key,
    required this.router,
    required this.rootKey,
    required this.messengerKey,
  });

  final GoRouter router;
  final GlobalKey<NavigatorState> rootKey;
  final GlobalKey<ScaffoldMessengerState> messengerKey;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return PositionedDirectional(
      end: Sp.s2,
      bottom: 96,
      child: Semantics(
        button: true,
        label: AppLocalizations.of(context).labTitle,
        excludeSemantics: true,
        child: Material(
          color: c.text,
          shape: const CircleBorder(),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: () => _open(rootKey.currentContext ?? context),
            child: SizedBox(
              width: Tap.min,
              height: Tap.min,
              child: Center(child: AppIcon(AppIconName.sensor, color: c.bg)),
            ),
          ),
        ),
      ),
    );
  }

  void _open(BuildContext rootContext) {
    showModalBottomSheet<void>(
      context: rootContext,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => _LabSheet(
        router: router,
        rootContext: rootContext,
        messengerKey: messengerKey,
      ),
    );
  }
}

class _LabSheet extends StatelessWidget {
  const _LabSheet({
    required this.router,
    required this.rootContext,
    required this.messengerKey,
  });

  final GoRouter router;
  final BuildContext rootContext;
  final GlobalKey<ScaffoldMessengerState> messengerKey;

  void _simulate(BuildContext context, CountdownCause cause) {
    final l = AppLocalizations.of(context);
    final settings = context.read<SettingsViewModel>();
    final path = router.routerDelegate.currentConfiguration.uri.path;
    Navigator.of(context).pop();
    final started = context.read<CountdownViewModel>().start(
      cause,
      autoDetectEnabled: settings.autoDetect,
      returnTo: path,
    );
    final messenger = messengerKey.currentState;
    if (!started && !settings.autoDetect && messenger != null) {
      showToastOn(messenger, l.labAutoOff);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final net = context.watch<ConnectivityRepository>();
    final countdown = context.watch<CountdownViewModel>();
    final c = context.colors;
    return Padding(
      padding: const EdgeInsets.all(Sp.s3),
      child: Container(
        padding: const EdgeInsets.all(Sp.s4),
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: BorderRadius.circular(Radii.lg),
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: Sp.s3,
            children: [
              Text(l.labSub, style: context.title),
              SectionTitle(l.labNet),
              AppSegmented<NetworkStatus>(
                label: l.labNet,
                selected: net.status,
                options: [
                  for (final n in NetworkStatus.values)
                    (n, l.network(n), networkIcon(n)),
                ],
                onChanged: net.setStatus,
              ),
              SectionTitle(l.labSim),
              AppButton(
                label: l.labSimQuake,
                icon: AppIconName.quake,
                variant: AppButtonVariant.outline,
                alignStart: true,
                onPressed: () => _simulate(context, CountdownCause.quake),
              ),
              AppButton(
                label: l.labSimCrash,
                icon: AppIconName.car,
                variant: AppButtonVariant.outline,
                alignStart: true,
                onPressed: () => _simulate(context, CountdownCause.crash),
              ),
              AppButton(
                label: l.labSimFall,
                icon: AppIconName.fall,
                variant: AppButtonVariant.outline,
                alignStart: true,
                onPressed: () => _simulate(context, CountdownCause.fall),
              ),
              AppButton(
                label: l.labSimAfad,
                icon: AppIconName.bell,
                variant: AppButtonVariant.outline,
                alignStart: true,
                onPressed: () {
                  Navigator.of(context).pop();
                  showAfadSheet(rootContext);
                },
              ),
              SectionTitle(l.labSpeed),
              AppSegmented<int>(
                label: l.labSpeed,
                selected: countdown.speed,
                options: const [(1, '1×', null), (10, '10×', null)],
                onChanged: countdown.setSpeed,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
