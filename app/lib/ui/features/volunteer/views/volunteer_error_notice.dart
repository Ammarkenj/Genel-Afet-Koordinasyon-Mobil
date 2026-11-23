import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../core/labels.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/parts.dart';

class VolunteerErrorNotice extends StatelessWidget {
  const VolunteerErrorNotice({
    super.key,
    required this.code,
    this.onRetry,
    this.onRegister,
  });

  final String code;
  final VoidCallback? onRetry;
  final VoidCallback? onRegister;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final requiresLogin = code == 'AUTHENTICATION_REQUIRED';
    final registrationMissing = code == 'VOLUNTEER_NOT_REGISTERED';
    final action = requiresLogin
        ? AppLinkButton(
            label: l.volLoginAction,
            onPressed: () => context.push('/login'),
          )
        : registrationMissing && onRegister != null
        ? AppLinkButton(label: l.volJoinBtn, onPressed: onRegister!)
        : onRetry == null
        ? null
        : AppLinkButton(label: l.volRetry, onPressed: onRetry!);

    return AppBanner(
      tone: Tone.warn,
      icon: AppIconName.info,
      title: l.volErrorTitle,
      body: l.volunteerError(code) ?? l.volServerError,
      extra: action,
    );
  }
}
