import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/brand.dart';
import '../../../core/widgets/layout.dart';
import '../../../core/widgets/parts.dart';
import '../view_models/login_view_model.dart';

/// Phone number, then the 6 digit code. "Continue without signing up" is always available.
class LoginView extends StatefulWidget {
  const LoginView({super.key});

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> {
  late final TextEditingController _phone;
  late final TextEditingController _code;

  @override
  void initState() {
    super.initState();
    final vm = context.read<LoginViewModel>();
    _phone = TextEditingController(text: vm.phone);
    _code = TextEditingController(text: vm.code);
  }

  @override
  void dispose() {
    _phone.dispose();
    _code.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final vm = context.watch<LoginViewModel>();
    final first = vm.step == 1;
    if (first && _code.text.isNotEmpty) _code.clear();

    Future<void> submit() async {
      if (vm.busy) return;
      if (first) {
        await vm.sendCode();
      } else if (await vm.submitCode() && context.mounted) {
        context.go('/home');
      }
    }

    final remoteError = switch (vm.error) {
      LoginError.unavailable => l.loginUnavailable,
      LoginError.rateLimited => l.loginRateLimited,
      LoginError.connection => l.loginConnectionError,
      LoginError.server => l.loginServerError,
      _ => null,
    };

    return AppScaffold(
      body: ScreenBody(
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 12),
            child: Center(child: BrandMark(size: 22, iconSize: 36)),
          ),
          StepLabel(first ? 1 : 2, 2),
          Semantics(
            header: true,
            child: Text(l.loginTitle, style: context.headline),
          ),
          Text(l.loginLead, style: context.bodyLg),
          if (first)
            LabeledField(
              label: l.loginPhone,
              controller: _phone,
              prefix: '+90',
              maxLength: 13,
              keyboardType: TextInputType.phone,
              hint: l.loginPhoneHint,
              readOnly: vm.busy,
              error: vm.error == LoginError.phone ? l.loginPhoneError : null,
              onChanged: vm.setPhone,
              onSubmitted: (_) => submit(),
            )
          else
            LabeledField(
              label: l.loginCode,
              controller: _code,
              maxLength: 6,
              hint: l.loginCodeHint,
              readOnly: vm.busy,
              error: switch (vm.error) {
                LoginError.code => l.loginCodeError,
                LoginError.codeInvalid => l.loginCodeInvalid,
                _ => null,
              },
              onChanged: vm.setCode,
              onSubmitted: (_) => submit(),
            ),
          if (remoteError != null)
            AppBanner(
              tone: Tone.warn,
              icon: AppIconName.info,
              body: remoteError,
            ),
          AppButton(
            label: first ? l.loginSendCode : l.loginSubmit,
            onPressed: submit,
            busy: vm.busy,
          ),
          if (!first)
            AppButton(
              label: l.loginChangeNumber,
              variant: AppButtonVariant.ghost,
              onPressed: vm.busy ? null : vm.changeNumber,
            ),
        ],
        pinned: [
          AppButton(
            label: l.loginGuest,
            variant: AppButtonVariant.outline,
            onPressed: () => context.go('/home'),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AppIcon(AppIconName.info, size: 20, color: context.hint.color),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  l.loginGuestNote,
                  style: context.hint,
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
