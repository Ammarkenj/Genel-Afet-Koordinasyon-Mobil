import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../domain/models/models.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/layout.dart';
import '../../../core/widgets/parts.dart';
import '../../report/view_models/report_view_model.dart';

/// Earthquake alert (AFAD sample data). Asks "what is your situation?" with the two answers
/// "I am safe" (green, first) and "I need help" (red), plus the assembly area.
Future<void> showAfadSheet(BuildContext context) {
  final l = AppLocalizations.of(context);
  final reports = context.read<ReportViewModel>();
  final router = GoRouter.of(context);
  return showAppSheet<void>(
    context,
    title: l.afadTitle,
    icon: AppIconName.quake,
    closable: true,
    leading: null,
    actions: [
      Builder(
        builder: (ctx) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [
              Wrap(
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 8,
                children: [
                  Text(l.afadBody, style: ctx.bodyLg),
                  AppTag(l.commonSample),
                ],
              ),
              Text(
                l.afadAsk,
                style: ctx.body.copyWith(fontWeight: FontWeight.w500),
              ),
              AppButton(
                label: l.homeSafe,
                icon: AppIconName.shieldCheck,
                variant: AppButtonVariant.safe,
                size: AppButtonSize.xl,
                onPressed: () {
                  Navigator.of(ctx).pop();
                  reports.sendSafe();
                  router.go('/status');
                },
              ),
              AppButton(
                label: l.homeHelp,
                icon: AppIconName.lifebuoy,
                variant: AppButtonVariant.danger,
                size: AppButtonSize.xl,
                onPressed: () {
                  Navigator.of(ctx).pop();
                  reports.sendHelp(IncidentType.quake);
                  router.go('/status');
                },
              ),
              AppButton(
                label: l.statusShowArea,
                icon: AppIconName.pin,
                variant: AppButtonVariant.outline,
                onPressed: () {
                  Navigator.of(ctx).pop();
                  router.go('/map');
                },
              ),
            ],
          );
        },
      ),
    ],
  );
}
