import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yasamhatti/ui/core/theme/app_colors.dart';

double _luminance(Color c) {
  double channel(double v) =>
      v <= 0.03928 ? v / 12.92 : math.pow((v + 0.055) / 1.055, 2.4).toDouble();
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

double contrast(Color a, Color b) {
  final la = _luminance(a), lb = _luminance(b);
  return (math.max(la, lb) + 0.05) / (math.min(la, lb) + 0.05);
}

// Same pairs and minimums as prototype/tools/check.js: 4.5:1 for text, 3:1 for boundaries and icons,
/// 7:1 for the two emergency buttons ("I need help" and the countdown's "I am fine").
void contrastSuite() {
  final pairs =
      <(String, Color Function(AppColors), Color Function(AppColors), double)>[
        ('body text on page', (c) => c.text, (c) => c.bg, 4.5),
        ('body text on card', (c) => c.text, (c) => c.surface, 4.5),
        ('text on muted surface', (c) => c.text, (c) => c.surface2, 4.5),
        (
          'countdown text on alarm background',
          (c) => c.text,
          (c) => c.dangerSoft,
          4.5,
        ),
        ('secondary text on page', (c) => c.textMuted, (c) => c.bg, 4.5),
        ('secondary text on card', (c) => c.textMuted, (c) => c.surface, 4.5),
        (
          'disabled button / tag text',
          (c) => c.textMuted,
          (c) => c.surface2,
          4.5,
        ),
        ('toast text', (c) => c.bg, (c) => c.text, 4.5),
        (
          'CRITICAL: "I need help" label',
          (c) => c.onDanger,
          (c) => c.danger,
          7,
        ),
        (
          'CRITICAL: "I am safe" / cancel countdown label',
          (c) => c.onSafe,
          (c) => c.safe,
          7,
        ),
        ('primary action label', (c) => c.onInfo, (c) => c.info, 4.5),
        ('error text on card', (c) => c.dangerText, (c) => c.surface, 4.5),
        ('error text on page', (c) => c.dangerText, (c) => c.bg, 4.5),
        (
          'danger chip / countdown icon',
          (c) => c.dangerText,
          (c) => c.dangerSoft,
          4.5,
        ),
        ('safe banner and chip', (c) => c.safeText, (c) => c.safeSoft, 4.5),
        ('switch "on" label', (c) => c.safeText, (c) => c.surface, 4.5),
        ('selected choice', (c) => c.infoText, (c) => c.infoSoft, 4.5),
        ('link / active nav label', (c) => c.infoText, (c) => c.surface, 4.5),
        ('ghost button on page', (c) => c.infoText, (c) => c.bg, 4.5),
        ('offline banner and chip', (c) => c.warnText, (c) => c.warnSoft, 4.5),
        (
          'control boundary on card',
          (c) => c.borderStrong,
          (c) => c.surface,
          3,
        ),
        ('control boundary on page', (c) => c.borderStrong, (c) => c.bg, 3),
        ('help button against page', (c) => c.danger, (c) => c.bg, 3),
        ('safe button against page', (c) => c.safe, (c) => c.bg, 3),
        ('primary button against page', (c) => c.info, (c) => c.bg, 3),
        ('urgency dots on card', (c) => c.info, (c) => c.surface, 3),
        ('route and position on map', (c) => c.info, (c) => c.surface2, 3),
        ('invalid field border', (c) => c.dangerAccent, (c) => c.surface, 3),
        (
          'countdown ring on alarm background',
          (c) => c.dangerAccent,
          (c) => c.dangerSoft,
          3,
        ),
        ('alert icon in dialog', (c) => c.warnAccent, (c) => c.surface, 3),
        ('focus ring on card', (c) => c.focus, (c) => c.surface, 3),
        ('focus ring on page', (c) => c.focus, (c) => c.bg, 3),
      ];

  for (final (theme, colors) in [
    ('light', AppColors.light),
    ('dark', AppColors.dark),
  ]) {
    group('contrast, $theme theme', () {
      for (final (what, fg, bg, minimum) in pairs) {
        test('$what >= $minimum:1', () {
          final ratio = contrast(fg(colors), bg(colors));
          expect(
            ratio,
            greaterThanOrEqualTo(minimum),
            reason: '$what is ${ratio.toStringAsFixed(2)}:1',
          );
        });
      }
    });
  }
}
