import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../theme/tokens.dart';
import 'app_icon.dart';

/// Segmented choice (language, theme). Selected = fill + check + bold, so it never relies on colour alone.
class AppSegmented<T> extends StatelessWidget {
  const AppSegmented({
    super.key,
    required this.label,
    required this.selected,
    required this.options,
    required this.onChanged,
  });

  final String label;
  final T selected;
  final List<(T, String, AppIconName?)> options;
  final ValueChanged<T> onChanged;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Semantics(
      container: true,
      label: label,
      child: Container(
        decoration: BoxDecoration(
          color: c.surface,
          border: Border.all(color: c.borderStrong, width: 2),
          borderRadius: BorderRadius.circular(Radii.sm),
        ),
        clipBehavior: Clip.antiAlias,
        child: Row(
          children: [
            for (final o in options)
              Expanded(
                child: Semantics(
                  button: true,
                  selected: o.$1 == selected,
                  label: o.$2,
                  excludeSemantics: true,
                  child: InkWell(
                    onTap: () => onChanged(o.$1),
                    child: Container(
                      constraints: const BoxConstraints(minHeight: Tap.min),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      color: o.$1 == selected ? c.info : Colors.transparent,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        spacing: 6,
                        children: [
                          if (o.$1 == selected)
                            AppIcon(
                              AppIconName.check,
                              size: IconSizes.sm,
                              color: c.onInfo,
                            ),
                          if (o.$3 != null)
                            AppIcon(
                              o.$3!,
                              size: IconSizes.sm,
                              color: o.$1 == selected ? c.onInfo : c.text,
                            ),
                          Flexible(
                            child: Text(
                              o.$2,
                              textAlign: TextAlign.center,
                              style: context.label.copyWith(
                                fontSize: 15,
                                fontWeight: o.$1 == selected
                                    ? FontWeight.w700
                                    : FontWeight.w500,
                                color: o.$1 == selected ? c.onInfo : c.text,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
