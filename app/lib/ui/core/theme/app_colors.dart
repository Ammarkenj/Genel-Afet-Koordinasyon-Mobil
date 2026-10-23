import 'package:flutter/material.dart';

/// Semantic colours. Values come from prototype/css/tokens.css and are the ONLY place hex values live:
/// screens read `context.colors.*` and never write `Color(0xFF…)`.
///
/// Each colour keeps one meaning: danger = "I need help" only, safe = "I am safe" and completed/delivered,
/// info = normal actions, warn = offline / waiting.
@immutable
class AppColors extends ThemeExtension<AppColors> {
  const AppColors({
    required this.bg,
    required this.surface,
    required this.surface2,
    required this.text,
    required this.textMuted,
    required this.border,
    required this.borderStrong,
    required this.danger,
    required this.onDanger,
    required this.dangerSoft,
    required this.dangerText,
    required this.dangerAccent,
    required this.safe,
    required this.onSafe,
    required this.safeSoft,
    required this.safeText,
    required this.info,
    required this.onInfo,
    required this.infoSoft,
    required this.infoText,
    required this.warnSoft,
    required this.warnText,
    required this.warnAccent,
    required this.focus,
    required this.scrim,
  });

  final Color bg, surface, surface2, text, textMuted, border, borderStrong;
  final Color danger, onDanger, dangerSoft, dangerText, dangerAccent;
  final Color safe, onSafe, safeSoft, safeText;
  final Color info, onInfo, infoSoft, infoText;
  final Color warnSoft, warnText, warnAccent;
  final Color focus, scrim;

  static const light = AppColors(
    bg: Color(0xFFF1F5F9),
    surface: Color(0xFFFFFFFF),
    surface2: Color(0xFFE8EDF3),
    text: Color(0xFF0F172A),
    textMuted: Color(0xFF475569),
    border: Color(0xFFCBD5E1),
    borderStrong: Color(0xFF64748B),
    danger: Color(0xFFAB1A1A),
    onDanger: Color(0xFFFFFFFF),
    dangerSoft: Color(0xFFFEE2E2),
    dangerText: Color(0xFF991B1B),
    dangerAccent: Color(0xFFDC2626),
    safe: Color(0xFF166534),
    onSafe: Color(0xFFFFFFFF),
    safeSoft: Color(0xFFDCFCE7),
    safeText: Color(0xFF14532D),
    info: Color(0xFF1D4ED8),
    onInfo: Color(0xFFFFFFFF),
    infoSoft: Color(0xFFDBEAFE),
    infoText: Color(0xFF1E3A8A),
    warnSoft: Color(0xFFFEF3C7),
    warnText: Color(0xFF78350F),
    warnAccent: Color(0xFFB45309),
    focus: Color(0xFF1D4ED8),
    scrim: Color(0xB8020617),
  );

  static const dark = AppColors(
    bg: Color(0xFF0B1220),
    surface: Color(0xFF151E2E),
    surface2: Color(0xFF1F2A3C),
    text: Color(0xFFF1F5F9),
    textMuted: Color(0xFFB4C0D0),
    border: Color(0xFF334155),
    borderStrong: Color(0xFF94A3B8),
    danger: Color(0xFFF87171),
    onDanger: Color(0xFF1A0303),
    dangerSoft: Color(0xFF3F1212),
    dangerText: Color(0xFFFCA5A5),
    dangerAccent: Color(0xFFF87171),
    safe: Color(0xFF4ADE80),
    onSafe: Color(0xFF052E16),
    safeSoft: Color(0xFF0F2E1C),
    safeText: Color(0xFF86EFAC),
    info: Color(0xFF93C5FD),
    onInfo: Color(0xFF0B1F4B),
    infoSoft: Color(0xFF14274A),
    infoText: Color(0xFFBFDBFE),
    warnSoft: Color(0xFF3A2A08),
    warnText: Color(0xFFFDE68A),
    warnAccent: Color(0xFFFBBF24),
    focus: Color(0xFF93C5FD),
    scrim: Color(0xC7000000),
  );

  @override
  AppColors copyWith() => this;

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) =>
      t < 0.5 ? this : (other as AppColors? ?? this);
}

extension AppColorsContext on BuildContext {
  AppColors get colors => Theme.of(this).extension<AppColors>()!;
}
