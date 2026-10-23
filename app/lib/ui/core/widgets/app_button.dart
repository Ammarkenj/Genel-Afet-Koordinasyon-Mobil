import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../theme/tokens.dart';
import 'app_icon.dart';

enum AppButtonVariant { danger, safe, info, outline, ghost, ghostDanger }

enum AppButtonSize { normal, xl, xxl }

/// Large, high-contrast button. Sizes follow the touch-target tokens: 56 / 72 / 96.
/// `onPressed == null` renders the disabled state; the screen must say why next to it.
class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = AppButtonVariant.info,
    this.size = AppButtonSize.normal,
    this.icon,
    this.sublabel,
    this.alignStart = false,
    this.trailingIcon,
    this.busy = false,
  });

  final String label;
  final String? sublabel;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final AppButtonSize size;
  final AppIconName? icon;
  final AppIconName? trailingIcon;
  final bool alignStart;

  /// Shows a spinner and ignores presses (confirmations that wait for a result).
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final enabled = onPressed != null && !busy;
    final disabled = onPressed == null;

    Color bg, fg, borderColor = Colors.transparent;
    switch (variant) {
      case AppButtonVariant.danger:
        bg = c.danger;
        fg = c.onDanger;
      case AppButtonVariant.safe:
        bg = c.safe;
        fg = c.onSafe;
      case AppButtonVariant.info:
        bg = c.info;
        fg = c.onInfo;
      case AppButtonVariant.outline:
        bg = c.surface;
        fg = c.text;
        borderColor = c.borderStrong;
      case AppButtonVariant.ghost:
        bg = Colors.transparent;
        fg = c.infoText;
      case AppButtonVariant.ghostDanger:
        bg = Colors.transparent;
        fg = c.dangerText;
    }
    if (disabled) {
      bg =
          variant == AppButtonVariant.ghost ||
              variant == AppButtonVariant.ghostDanger
          ? Colors.transparent
          : c.surface2;
      fg = c.textMuted;
      borderColor =
          variant == AppButtonVariant.ghost ||
              variant == AppButtonVariant.ghostDanger
          ? Colors.transparent
          : c.border;
    }

    final ghost =
        variant == AppButtonVariant.ghost ||
        variant == AppButtonVariant.ghostDanger;
    final minHeight = ghost
        ? Tap.min
        : switch (size) {
            AppButtonSize.normal => Tap.control,
            AppButtonSize.xl => Tap.emergency,
            AppButtonSize.xxl => Tap.critical,
          };
    final fontSize = ghost
        ? 16.0
        : switch (size) {
            AppButtonSize.normal => 18.0,
            AppButtonSize.xl => 20.0,
            AppButtonSize.xxl => 24.0,
          };
    final iconSize = size == AppButtonSize.normal ? IconSizes.md : IconSizes.lg;
    final textStyle = context.body.copyWith(
      fontSize: fontSize,
      fontWeight: FontWeight.w700,
      height: 1.25,
      color: fg,
    );

    final text = Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: alignStart
          ? CrossAxisAlignment.start
          : CrossAxisAlignment.center,
      children: [
        Text(
          label,
          style: textStyle,
          textAlign: alignStart ? TextAlign.start : TextAlign.center,
        ),
        if (sublabel != null)
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Text(
              sublabel!,
              style: context.label.copyWith(
                color: fg,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
      ],
    );

    return Semantics(
      button: true,
      enabled: enabled,
      label: sublabel == null ? label : '$label. $sublabel',
      excludeSemantics: true,
      child: Material(
        color: bg,
        borderRadius: BorderRadius.circular(Radii.md),
        child: InkWell(
          onTap: enabled ? onPressed : null,
          borderRadius: BorderRadius.circular(Radii.md),
          child: Container(
            constraints: BoxConstraints(
              minHeight: minHeight,
              minWidth: Tap.min,
            ),
            padding: const EdgeInsetsDirectional.symmetric(
              horizontal: Sp.s4,
              vertical: Sp.s2,
            ),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(Radii.md),
              border: Border.all(color: borderColor, width: 2),
            ),
            child: IconTheme(
              data: IconThemeData(color: fg),
              child: Row(
                mainAxisAlignment: alignStart
                    ? MainAxisAlignment.start
                    : MainAxisAlignment.center,
                children: [
                  if (busy)
                    SizedBox(
                      width: IconSizes.sm,
                      height: IconSizes.sm,
                      child: CircularProgressIndicator(
                        strokeWidth: 3,
                        color: fg,
                      ),
                    )
                  else if (icon != null)
                    AppIcon(icon!, size: iconSize),
                  if (busy || icon != null) const SizedBox(width: Sp.s3),
                  alignStart ? Expanded(child: text) : Flexible(child: text),
                  if (trailingIcon != null) ...[
                    const SizedBox(width: Sp.s3),
                    AppIcon(trailingIcon!, flip: true),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// 48x48 round icon button (back, call, stepper). Always has an accessible label.
class AppIconButton extends StatelessWidget {
  const AppIconButton({
    super.key,
    required this.icon,
    required this.semanticLabel,
    required this.onPressed,
    this.outlined = false,
    this.flip = false,
  });

  final AppIconName icon;
  final String semanticLabel;
  final VoidCallback? onPressed;
  final bool outlined;
  final bool flip;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final enabled = onPressed != null;
    final fg = enabled ? c.text : c.textMuted;
    return Semantics(
      button: true,
      enabled: enabled,
      label: semanticLabel,
      excludeSemantics: true,
      child: Material(
        color: outlined ? c.surface : Colors.transparent,
        shape: CircleBorder(
          side: outlined
              ? BorderSide(color: enabled ? c.borderStrong : c.border, width: 2)
              : BorderSide.none,
        ),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onPressed,
          child: SizedBox(
            width: Tap.min,
            height: Tap.min,
            child: Center(
              child: AppIcon(icon, color: fg, flip: flip),
            ),
          ),
        ),
      ),
    );
  }
}

/// Underlined text link ("Düzenle"), 48dp tall.
class AppLinkButton extends StatelessWidget {
  const AppLinkButton({
    super.key,
    required this.label,
    required this.onPressed,
  });

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      excludeSemantics: true,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(Radii.sm),
        child: ConstrainedBox(
          constraints: const BoxConstraints(
            minHeight: Tap.min,
            minWidth: Tap.min,
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: Sp.s2),
            child: Center(
              child: Text(
                label,
                style: context.label.copyWith(
                  fontWeight: FontWeight.w700,
                  color: context.colors.infoText,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
