import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'tokens.dart';

/// Builds the app theme from the semantic tokens. Arabic gets taller line heights (its letters are taller).
ThemeData buildTheme(Brightness brightness, {bool arabic = false}) {
  final c = brightness == Brightness.dark ? AppColors.dark : AppColors.light;

  TextStyle style(
    double size,
    FontWeight weight,
    double latinHeight,
    double arabicHeight,
  ) => TextStyle(
    fontFamily: 'Roboto',
    fontFamilyFallback: const ['NotoSansArabic'],
    fontSize: size,
    fontWeight: weight,
    height: arabic ? arabicHeight : latinHeight,
    color: c.text,
  );

  final textTheme = TextTheme(
    displayLarge: style(
      88,
      FontWeight.w900,
      1,
      1,
    ).copyWith(fontFeatures: const [FontFeature.tabularFigures()]),
    headlineMedium: style(arabic ? 25 : 26, FontWeight.w700, 1.25, 1.5),
    titleLarge: style(20, FontWeight.w700, 1.3, 1.55),
    bodyLarge: style(18, FontWeight.w400, 1.5, 1.75),
    bodyMedium: style(16, FontWeight.w400, 1.5, 1.75),
    labelLarge: style(14, FontWeight.w500, 1.4, 1.65),
    labelSmall: style(12, FontWeight.w500, 1.35, 1.5),
  );

  final scheme = ColorScheme(
    brightness: brightness,
    primary: c.info,
    onPrimary: c.onInfo,
    secondary: c.safe,
    onSecondary: c.onSafe,
    error: c.danger,
    onError: c.onDanger,
    surface: c.surface,
    onSurface: c.text,
    outline: c.borderStrong,
    outlineVariant: c.border,
  );

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: scheme,
    scaffoldBackgroundColor: c.bg,
    canvasColor: c.bg,
    textTheme: textTheme,
    fontFamily: 'Roboto',
    fontFamilyFallback: const ['NotoSansArabic'],
    extensions: [c],
    dividerColor: c.border,
    splashFactory: InkRipple.splashFactory,
    focusColor: c.focus,
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: c.text,
      contentTextStyle: textTheme.bodyMedium!.copyWith(
        color: c.bg,
        fontWeight: FontWeight.w500,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Radii.sm),
      ),
    ),
  );
}

/// Text styles used across screens, resolved from the theme so they follow the language and theme.
extension AppTextContext on BuildContext {
  TextTheme get _t => Theme.of(this).textTheme;
  TextStyle get display => _t.displayLarge!;
  TextStyle get headline => _t.headlineMedium!;
  TextStyle get title => _t.titleLarge!;
  TextStyle get bodyLg => _t.bodyLarge!;
  TextStyle get body => _t.bodyMedium!;
  TextStyle get label => _t.labelLarge!;
  TextStyle get caption => _t.labelSmall!;

  /// Small section heading ("Hızlı araçlar").
  TextStyle get section => _t.labelLarge!.copyWith(
    fontSize: 15,
    fontWeight: FontWeight.w700,
    color: colors.textMuted,
  );

  /// Secondary helper text.
  TextStyle get hint => _t.labelLarge!.copyWith(color: colors.textMuted);
}
