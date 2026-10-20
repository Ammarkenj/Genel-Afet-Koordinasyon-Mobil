import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/brand.dart';
import '../../../core/widgets/layout.dart';
import '../../../core/widgets/parts.dart';
import '../../profile/view_models/settings_view_model.dart';
import '../view_models/onboarding_view_model.dart';

/// Step 1: language. Step 2: permissions and KVKK consent.
class OnboardingView extends StatelessWidget {
  const OnboardingView({super.key});

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<OnboardingViewModel>();
    return AppScaffold(
      body: vm.step == 1 ? const _LanguageStep() : const _PermissionStep(),
    );
  }
}

class _LanguageStep extends StatelessWidget {
  const _LanguageStep();

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final settings = context.watch<SettingsViewModel>();
    return ScreenBody(
      children: [
        const StepLabel(1, 2),
        Padding(
          padding: const EdgeInsets.only(top: Sp.s6, bottom: Sp.s2),
          child: Column(
            spacing: Sp.s2,
            children: [
              AppIcon(
                AppIconName.lifebuoy,
                size: 72,
                color: context.colors.dangerAccent,
              ),
              Semantics(
                header: true,
                child: Text(
                  'YaşamHattı',
                  style: context.title.copyWith(
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.3,
                    height: 1.2,
                  ),
                ),
              ),
              Text(
                l.onbTagline,
                style: context.bodyLg,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
        SectionTitle(l.onbChooseLang),
        ChoiceTile(
          icon: AppIconName.globe,
          title: 'Türkçe',
          large: true,
          selected: !settings.isArabic,
          onTap: () => settings.setLanguage('tr'),
        ),
        ChoiceTile(
          icon: AppIconName.globe,
          title: 'العربية',
          large: true,
          selected: settings.isArabic,
          onTap: () => settings.setLanguage('ar'),
        ),
      ],
      pinned: [
        AppButton(
          label: l.commonContinue,
          size: AppButtonSize.xl,
          trailingIcon: AppIconName.chevron,
          onPressed: context.read<OnboardingViewModel>().next,
        ),
      ],
    );
  }
}

class _PermissionStep extends StatelessWidget {
  const _PermissionStep();

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final vm = context.watch<OnboardingViewModel>();
    final c = context.colors;
    final perms = [
      (
        Permission.location,
        AppIconName.pin,
        l.permLocation,
        l.permLocationDesc,
      ),
      (
        Permission.notifications,
        AppIconName.bell,
        l.permNotif,
        l.permNotifDesc,
      ),
      (Permission.sensors, AppIconName.sensor, l.permSensor, l.permSensorDesc),
    ];
    return ScreenBody(
      children: [
        ScreenHeader(title: l.onbPermTitle, onBack: vm.back),
        const StepLabel(2, 2),
        Text(l.onbPermLead, style: context.bodyLg),
        AppCard(
          flush: true,
          child: Column(
            children: [
              for (var i = 0; i < perms.length; i++) ...[
                if (i > 0) Divider(height: 1, thickness: 1, color: c.border),
                Row(
                  children: [
                    AppIcon(perms[i].$2, color: c.infoText),
                    const SizedBox(width: Sp.s3),
                    Expanded(
                      child: SwitchRow(
                        title: perms[i].$3,
                        description: perms[i].$4,
                        value: vm.isGranted(perms[i].$1),
                        stateLabel: vm.isGranted(perms[i].$1)
                            ? l.commonOn
                            : l.commonOff,
                        onChanged: (_) => vm.togglePermission(perms[i].$1),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
        CheckRow(
          label: l.onbKvkk,
          value: vm.kvkk,
          invalid: vm.kvkkError,
          onChanged: vm.setKvkk,
        ),
        if (vm.kvkkError) FieldError(l.onbKvkkNeeded),
      ],
      pinned: [
        AppButton(
          label: l.commonContinue,
          size: AppButtonSize.xl,
          trailingIcon: AppIconName.chevron,
          onPressed: () {
            if (vm.finish()) context.go('/login');
          },
        ),
      ],
    );
  }
}
