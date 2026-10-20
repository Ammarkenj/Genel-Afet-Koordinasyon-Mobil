import 'package:flutter/material.dart';

import '../../../l10n/app_localizations.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../theme/tokens.dart';
import 'app_button.dart';
import 'app_icon.dart';

/// Screen content: scrolls, keeps 16dp gutters, spaces children by 16dp and pins [pinned] to the bottom
/// when the content is short (the main action stays under the thumb).
class ScreenBody extends StatelessWidget {
  const ScreenBody({
    super.key,
    required this.children,
    this.pinned = const [],
    this.spacing = Sp.s4,
  });

  final List<Widget> children;
  final List<Widget> pinned;
  final double spacing;

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(Sp.s4, Sp.s2, Sp.s4, Sp.s6),
          sliver: SliverFillRemaining(
            hasScrollBody: false,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: spacing,
              children: [
                ...children,
                if (pinned.isNotEmpty) ...[
                  const Spacer(),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    spacing: Sp.s3,
                    children: pinned,
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// Screen title (the one heading of the screen) with an optional back button.
class ScreenHeader extends StatelessWidget {
  const ScreenHeader({
    super.key,
    required this.title,
    this.onBack,
    this.trailing,
  });

  final String title;
  final VoidCallback? onBack;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: Tap.min),
      child: Row(
        children: [
          if (onBack != null) ...[
            AppIconButton(
              icon: AppIconName.back,
              flip: true,
              semanticLabel: AppLocalizations.of(context).commonBack,
              onPressed: onBack,
            ),
            const SizedBox(width: Sp.s2),
          ],
          Expanded(
            child: Semantics(
              header: true,
              child: Text(title, style: context.headline),
            ),
          ),
          ?trailing,
        ],
      ),
    );
  }
}

/// A plain screen outside the tab shell (onboarding, login, countdown).
class AppScaffold extends StatelessWidget {
  const AppScaffold({super.key, required this.body, this.background});

  final Widget body;
  final Color? background;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: background ?? context.colors.bg,
      body: SafeArea(child: body),
    );
  }
}

/// Bottom sheet used for dialogs that come up near the thumb: the safe answer comes first.
Future<T?> showAppSheet<T>(
  BuildContext context, {
  required String title,
  String? message,
  required List<Widget> actions,
  Widget? leading,
  AppIconName? icon,
  bool closable = false,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    barrierColor: context.colors.scrim,
    elevation: 0,
    builder: (ctx) {
      final c = ctx.colors;
      return Padding(
        padding: const EdgeInsets.all(Sp.s3),
        child: Semantics(
          scopesRoute: true,
          explicitChildNodes: true,
          namesRoute: true,
          label: title,
          child: Container(
            padding: const EdgeInsets.all(Sp.s4),
            decoration: BoxDecoration(
              color: c.surface,
              borderRadius: BorderRadius.circular(Radii.lg),
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: Sp.s3,
                children: [
                  ?leading,
                  Row(
                    children: [
                      if (icon != null) ...[
                        AppIcon(icon, size: IconSizes.lg, color: c.warnAccent),
                        const SizedBox(width: Sp.s2),
                      ],
                      Expanded(
                        child: Semantics(
                          header: true,
                          child: Text(title, style: ctx.headline),
                        ),
                      ),
                      if (closable)
                        AppIconButton(
                          icon: AppIconName.close,
                          semanticLabel: AppLocalizations.of(ctx).commonClose,
                          onPressed: () => Navigator.of(ctx).pop(),
                        ),
                    ],
                  ),
                  if (message != null) Text(message, style: ctx.bodyLg),
                  ...actions,
                ],
              ),
            ),
          ),
        ),
      );
    },
  );
}

/// Short message above the navigation bar (announced to screen readers by the SnackBar).
void showToast(BuildContext context, String message) =>
    showToastOn(ScaffoldMessenger.of(context), message);

void showToastOn(ScaffoldMessengerState messenger, String message) {
  messenger.hideCurrentSnackBar();
  messenger.showSnackBar(
    SnackBar(
      content: Text(message),
      duration: const Duration(milliseconds: 4500),
    ),
  );
}
