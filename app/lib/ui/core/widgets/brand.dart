import 'package:flutter/material.dart';

import '../../../l10n/app_localizations.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../theme/tokens.dart';
import 'app_icon.dart';

/// "YaşamHattı" with the lifebuoy mark. Large on onboarding, small on login and the home bar.
class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.size = 22, this.iconSize = IconSizes.md});

  final double size;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        AppIcon(
          AppIconName.lifebuoy,
          size: iconSize,
          color: context.colors.dangerAccent,
        ),
        const SizedBox(width: Sp.s2),
        Flexible(
          child: Text(
            'YaşamHattı',
            style: context.title.copyWith(
              fontSize: size,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.2,
              height: 1.2,
            ),
          ),
        ),
      ],
    );
  }
}

/// "Adım 1 / 2" for multi-step flows (setup, login).
class StepLabel extends StatelessWidget {
  const StepLabel(this.step, this.total, {super.key});

  final int step;
  final int total;

  @override
  Widget build(BuildContext context) {
    return Text(
      AppLocalizations.of(context).commonStep(step, total),
      style: context.hint.copyWith(fontWeight: FontWeight.w700),
    );
  }
}
