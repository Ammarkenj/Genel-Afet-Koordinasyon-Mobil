import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../core/labels.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/layout.dart';
import '../view_models/countdown_view_model.dart';

/// 60 second safety countdown. The green cancel button is the biggest thing on screen. The system Back
/// button does NOT cancel it silently (PopScope): cancelling is only done with the green button.
class CountdownView extends StatefulWidget {
  const CountdownView({super.key});

  @override
  State<CountdownView> createState() => _CountdownViewState();
}

class _CountdownViewState extends State<CountdownView> {
  int _lastAnnounced = -1;

  @override
  void initState() {
    super.initState();
    HapticFeedback.heavyImpact();
  }

  /// Vibrate on each of the last five seconds, and tell screen readers every 10 seconds and then each of the last five.
  void _feedback(CountdownViewModel vm, AppLocalizations l) {
    final n = vm.remaining;
    if (n == _lastAnnounced || !vm.active) return;
    _lastAnnounced = n;
    if (n <= 5) HapticFeedback.selectionClick();
    if (n % 10 == 0 || n <= 5) {
      SemanticsService.sendAnnouncement(
        View.of(context),
        '$n ${l.cdSeconds}',
        Directionality.of(context),
        assertiveness: Assertiveness.assertive,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final vm = context.watch<CountdownViewModel>();
    final c = context.colors;
    final cause = vm.cause;
    if (cause == null) return const SizedBox.shrink();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _feedback(vm, l);
    });

    return PopScope(
      canPop: false,
      child: AppScaffold(
        background: c.dangerSoft,
        body: ScreenBody(
          spacing: Sp.s2,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: Sp.s2),
              child: Column(
                spacing: Sp.s2,
                children: [
                  AppIcon(
                    AppIconName.alert,
                    size: IconSizes.xl,
                    color: c.dangerText,
                  ),
                  Semantics(
                    header: true,
                    child: Text(
                      l.cause(cause),
                      style: context.headline,
                      textAlign: TextAlign.center,
                    ),
                  ),
                  Text(
                    l.cdDesc,
                    style: context.bodyLg,
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: Sp.s2),
                  Semantics(
                    label: l.cdTimer,
                    value: '${vm.remaining} ${l.cdSeconds}',
                    excludeSemantics: true,
                    child: SizedBox(
                      width: 216,
                      height: 216,
                      child: CustomPaint(
                        painter: _RingPainter(
                          progress: vm.remaining / vm.totalSeconds,
                          track: c.surface,
                          color: c.dangerAccent,
                        ),
                        // FittedBox: the big number shrinks inside the ring at the largest text sizes.
                        child: Center(
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text('${vm.remaining}', style: context.display),
                                Text(
                                  l.cdSeconds,
                                  style: context.label.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          pinned: [
            AppButton(
              label: l.cdCancel,
              icon: AppIconName.shieldCheck,
              variant: AppButtonVariant.safe,
              size: AppButtonSize.xxl,
              onPressed: vm.cancel,
            ),
            AppButton(
              label: l.cdNow,
              icon: AppIconName.lifebuoy,
              variant: AppButtonVariant.danger,
              size: AppButtonSize.xl,
              onPressed: vm.sendNow,
            ),
          ],
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter({
    required this.progress,
    required this.track,
    required this.color,
  });

  final double progress;
  final Color track;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    const stroke = 12.0;
    final center = size.center(Offset.zero);
    final radius = size.width / 2 - stroke / 2 - 4;
    final base = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..color = track;
    canvas.drawCircle(center, radius, base);
    final arc = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round
      ..color = color;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress.clamp(0, 1),
      false,
      arc,
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) =>
      old.progress != progress || old.track != track || old.color != color;
}
