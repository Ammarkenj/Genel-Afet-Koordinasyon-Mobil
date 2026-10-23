import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../icons/icon_paths.dart';
import '../theme/app_colors.dart';
import '../theme/tokens.dart';

export '../icons/icon_paths.dart' show AppIconName;

/// One outline icon family (24x24 grid, 2px stroke, no emoji). Decorative by default: the label next to it
/// carries the meaning, so it is hidden from screen readers.
class AppIcon extends StatelessWidget {
  const AppIcon(
    this.name, {
    super.key,
    this.size = IconSizes.md,
    this.color,
    this.flip = false,
  });

  final AppIconName name;
  final double size;
  final Color? color;

  /// Directional icons (back arrow, chevron) mirror in right-to-left languages.
  final bool flip;

  @override
  Widget build(BuildContext context) {
    final tint = color ?? IconTheme.of(context).color ?? context.colors.text;
    final svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" '
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${kIconPaths[name]}</svg>';
    Widget icon = SvgPicture.string(
      svg,
      width: size,
      height: size,
      colorFilter: ColorFilter.mode(tint, BlendMode.srcIn),
      excludeFromSemantics: true,
    );
    if (flip && Directionality.of(context) == TextDirection.rtl) {
      icon = Transform.flip(flipX: true, child: icon);
    }
    return ExcludeSemantics(child: icon);
  }
}
