import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/parts.dart';
import '../view_models/volunteer_view_model.dart';

/// One row on Home and on Profile. The bottom navigation is already full at five items, so volunteering
/// is reached from here instead of from a sixth tab.
class VolunteerEntryRow extends StatelessWidget {
  const VolunteerEntryRow({super.key});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final vm = context.watch<VolunteerViewModel>();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 8,
      children: [
        SectionTitle(l.volSection),
        ListRowButton(
          leading: AppIcon(
            AppIconName.users,
            size: 32,
            color: context.colors.infoText,
          ),
          title: vm.joined ? l.volEntryHub : l.volEntryJoin,
          subtitle: l.volEntrySub,
          chevron: true,
          onTap: () {
            vm.origin = GoRouterState.of(context).uri.path;
            context.push(vm.joined ? '/vol' : '/vol/join');
          },
        ),
      ],
    );
  }
}
