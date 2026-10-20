import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../l10n/app_localizations.dart';
import '../theme/app_colors.dart';
import '../theme/app_theme.dart';
import '../theme/tokens.dart';
import 'app_icon.dart';

/// Tab shell: five items at most. The volunteer flow, disaster selection and report status live under "Ana Sayfa".
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.location, required this.child});

  final String location;
  final Widget child;

  static const _tabs = ['/home', '/map', '/tools', '/donate', '/profile'];

  int get _index {
    for (var i = 1; i < _tabs.length; i++) {
      if (location.startsWith(_tabs[i])) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final items = [
      (AppIconName.home, l.navHome),
      (AppIconName.map, l.navMap),
      (AppIconName.grid, l.navTools),
      (AppIconName.heart, l.navDonate),
      (AppIconName.user, l.navProfile),
    ];
    final c = context.colors;
    return Scaffold(
      backgroundColor: c.bg,
      body: SafeArea(bottom: false, child: child),
      bottomNavigationBar: Semantics(
        container: true,
        label: l.navLabel,
        child: Container(
          decoration: BoxDecoration(
            color: c.surface,
            border: Border(top: BorderSide(color: c.border)),
          ),
          child: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(4, 6, 4, 6),
              child: Row(
                children: [
                  for (var i = 0; i < items.length; i++)
                    Expanded(
                      child: _NavItem(
                        icon: items[i].$1,
                        label: items[i].$2,
                        selected: i == _index,
                        onTap: () => context.go(_tabs[i]),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final AppIconName icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final fg = selected ? c.infoText : c.textMuted;
    return Semantics(
      button: true,
      selected: selected,
      label: label,
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(Radii.sm),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: Tap.control),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            spacing: 2,
            children: [
              Container(
                width: 56,
                height: 30,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: selected ? c.infoSoft : Colors.transparent,
                  borderRadius: BorderRadius.circular(Radii.pill),
                ),
                child: AppIcon(icon, color: fg),
              ),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: context.caption.copyWith(
                  color: fg,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
