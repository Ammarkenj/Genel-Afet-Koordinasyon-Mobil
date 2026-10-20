import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/layout.dart';
import '../../../core/widgets/parts.dart';
import '../../../core/widgets/segmented.dart';
import '../../login/view_models/login_view_model.dart';
import '../../volunteer/views/volunteer_entry_row.dart';
import '../view_models/settings_view_model.dart';

/// Profile and settings. Personal and medical details are sample data and are shown to rescuers with a report.
class ProfileView extends StatelessWidget {
  const ProfileView({super.key});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final settings = context.watch<SettingsViewModel>();
    void proto() => showToast(context, l.toastProto);
    final dark = Theme.of(context).brightness == Brightness.dark;
    const phone = '+90 5XX XXX XX XX';

    return ScreenBody(
      children: [
        ScreenHeader(title: l.profileTitle),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SectionTitle(
                l.profilePersonal,
                trailing: AppLinkButton(label: l.profileEdit, onPressed: proto),
              ),
              KvCard(
                card: false,
                rows: [
                  (l.profileName, KvText(l.profileNameVal)),
                  (l.profilePhone, const KvText(phone, ltr: true)),
                ],
              ),
            ],
          ),
        ),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SectionTitle(
                l.profileMedical,
                trailing: AppLinkButton(label: l.profileEdit, onPressed: proto),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: Sp.s1),
                child: Text(l.profileMedicalNote, style: context.hint),
              ),
              KvCard(
                card: false,
                rows: [
                  (l.profileBlood, const KvText('A Rh+', ltr: true)),
                  (l.profileChronic, KvText(l.profileChronicVal)),
                  (l.profileAllergy, KvText(l.profileAllergyVal)),
                ],
              ),
            ],
          ),
        ),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: Sp.s2,
            children: [
              SectionTitle(l.profileContacts),
              for (final name in [l.profileContact1, l.profileContact2])
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: context.body.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const Directionality(
                            textDirection: TextDirection.ltr,
                            child: Text(phone, style: TextStyle(fontSize: 14)),
                          ),
                        ],
                      ),
                    ),
                    AppIconButton(
                      icon: AppIconName.phone,
                      outlined: true,
                      semanticLabel: l.profileCallContact(name),
                      onPressed: () => showToast(context, l.toastCall),
                    ),
                  ],
                ),
              AppButton(
                label: l.profileAddContact,
                icon: AppIconName.plus,
                variant: AppButtonVariant.outline,
                onPressed: proto,
              ),
            ],
          ),
        ),
        const VolunteerEntryRow(),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: Sp.s3,
            children: [
              SectionTitle(l.profileSettings),
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: Sp.s2,
                children: [
                  Text(
                    l.profileLang,
                    style: context.body.copyWith(fontWeight: FontWeight.w500),
                  ),
                  AppSegmented<String>(
                    label: l.profileLang,
                    selected: settings.locale.languageCode,
                    options: const [
                      ('tr', 'Türkçe', null),
                      ('ar', 'العربية', null),
                    ],
                    onChanged: settings.setLanguage,
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: Sp.s2,
                children: [
                  Text(
                    l.profileTheme,
                    style: context.body.copyWith(fontWeight: FontWeight.w500),
                  ),
                  AppSegmented<ThemeMode>(
                    label: l.profileTheme,
                    selected: dark ? ThemeMode.dark : ThemeMode.light,
                    options: [
                      (ThemeMode.light, l.profileLight, AppIconName.sun),
                      (ThemeMode.dark, l.profileDark, AppIconName.moon),
                    ],
                    onChanged: settings.setThemeMode,
                  ),
                ],
              ),
              SwitchRow(
                title: l.profileAuto,
                description: l.profileAutoDesc,
                value: settings.autoDetect,
                stateLabel: settings.autoDetect ? l.commonOn : l.commonOff,
                onChanged: settings.setAutoDetect,
              ),
              SwitchRow(
                title: l.profileSms,
                description: l.profileSmsDesc,
                value: settings.smsBackup,
                stateLabel: settings.smsBackup ? l.commonOn : l.commonOff,
                onChanged: settings.setSmsBackup,
              ),
              NoteLine(icon: AppIconName.lock, text: l.profilePrivacy),
            ],
          ),
        ),
        AppButton(
          label: l.profileLogout,
          variant: AppButtonVariant.outline,
          onPressed: () {
            context.read<LoginViewModel>().reset();
            context.go('/login');
            showToast(context, l.toastLoggedOut);
          },
        ),
      ],
    );
  }
}
