import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../domain/models/models.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../core/labels.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/layout.dart';
import '../view_models/report_view_model.dart';

/// Second tap of "Yardım İstiyorum": pick the incident type and the report is sent immediately.
class SelectView extends StatelessWidget {
  const SelectView({super.key});

  static const _types = [
    IncidentType.quake,
    IncidentType.crash,
    IncidentType.fall,
    IncidentType.fire,
  ];

  void _send(BuildContext context, IncidentType type) {
    HapticFeedback.heavyImpact();
    context.read<ReportViewModel>().sendHelp(type);
    context.pushReplacement('/status');
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return ScreenBody(
      children: [
        ScreenHeader(title: l.selectTitle, onBack: () => context.pop()),
        Text(l.selectLead, style: context.bodyLg),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 12,
          children: [
            for (final type in _types)
              AppButton(
                label: l.incident(type),
                icon: incidentIcon(type),
                trailingIcon: AppIconName.chevron,
                variant: AppButtonVariant.outline,
                size: AppButtonSize.xl,
                alignStart: true,
                onPressed: () => _send(context, type),
              ),
            AppButton(
              label: l.typeOther,
              variant: AppButtonVariant.ghost,
              onPressed: () => _send(context, IncidentType.other),
            ),
          ],
        ),
      ],
    );
  }
}
