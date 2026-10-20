import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/layout.dart';
import '../../../core/widgets/parts.dart';
import '../view_models/tools_view_model.dart';

/// Siren, SOS flash, 112 and the SMS fallback note. Audio, flash, calls and SMS are simulated in this phase.
class ToolsView extends StatelessWidget {
  const ToolsView({super.key});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final vm = context.watch<ToolsViewModel>();
    return ScreenBody(
      children: [
        ScreenHeader(title: l.toolsTitle),
        _ToolCard(
          icon: AppIconName.siren,
          title: l.toolsSirenTitle,
          desc: l.toolsSirenDesc,
          on: vm.siren,
          onText: l.toolsSirenOn,
          onToggle: vm.toggleSiren,
        ),
        _ToolCard(
          icon: AppIconName.flash,
          title: l.toolsFlashTitle,
          desc: l.toolsFlashDesc,
          on: vm.flash,
          onText: l.toolsFlashOn,
          onToggle: vm.toggleFlash,
        ),
        AppButton(
          label: l.homeCall,
          icon: AppIconName.phone,
          variant: AppButtonVariant.danger,
          size: AppButtonSize.xl,
          onPressed: () => showToast(context, l.toastCall),
        ),
        AppCard(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: Sp.s3,
            children: [
              AppIcon(
                AppIconName.sms,
                size: IconSizes.lg,
                color: context.colors.infoText,
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SectionTitle(l.toolsSmsTitle),
                    Text(l.toolsSmsDesc, style: context.hint),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ToolCard extends StatelessWidget {
  const _ToolCard({
    required this.icon,
    required this.title,
    required this.desc,
    required this.on,
    required this.onText,
    required this.onToggle,
  });

  final AppIconName icon;
  final String title;
  final String desc;
  final bool on;
  final String onText;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.all(Sp.s4),
      decoration: BoxDecoration(
        color: c.surface,
        border: Border.all(color: on ? c.info : c.border, width: on ? 2 : 1),
        borderRadius: BorderRadius.circular(Radii.md),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: Sp.s2,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: Sp.s3,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: AppIcon(icon, size: IconSizes.lg, color: c.infoText),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Semantics(
                      header: true,
                      child: Text(title, style: context.title),
                    ),
                    Text(desc, style: context.hint),
                  ],
                ),
              ),
            ],
          ),
          if (on)
            Row(
              spacing: Sp.s2,
              children: [
                Container(
                  width: 14,
                  height: 14,
                  decoration: BoxDecoration(
                    color: c.info,
                    shape: BoxShape.circle,
                  ),
                ),
                Expanded(
                  child: Text(
                    onText,
                    style: context.body.copyWith(
                      fontWeight: FontWeight.w700,
                      color: c.infoText,
                    ),
                  ),
                ),
              ],
            ),
          AppButton(
            label: on ? l.toolsStop : l.toolsStart,
            variant: on ? AppButtonVariant.outline : AppButtonVariant.info,
            size: AppButtonSize.xl,
            onPressed: onToggle,
          ),
        ],
      ),
    );
  }
}
