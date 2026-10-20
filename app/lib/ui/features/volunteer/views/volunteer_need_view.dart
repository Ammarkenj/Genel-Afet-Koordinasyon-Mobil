import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../core/labels.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/layout.dart';
import '../../../core/widgets/parts.dart';
import '../view_models/volunteer_view_model.dart';

/// One need: event, urgency, distance and the single primary action "Görevi kabul et".
/// While another task is active the button is disabled and the reason is written above it.
class VolunteerNeedView extends StatelessWidget {
  const VolunteerNeedView({super.key});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final vm = context.watch<VolunteerViewModel>();
    final n = vm.needDetail;
    final c = context.colors;
    return ScreenBody(
      children: [
        ScreenHeader(title: l.volNeedTitle, onBack: () => context.go('/vol')),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: Sp.s2,
            children: [
              Align(
                alignment: AlignmentDirectional.centerStart,
                child: AppTag(l.commonSample),
              ),
              Row(
                spacing: Sp.s2,
                children: [
                  AppIcon(needIcon(n.id), size: IconSizes.lg, color: c.text),
                  Expanded(child: Text(l.needName(n.id), style: context.title)),
                ],
              ),
              Text(l.needDesc(n.id), style: context.bodyLg),
            ],
          ),
        ),
        KvCard(
          rows: [
            (l.volEvent, KvText(l.volEventName)),
            (
              l.volUrgency,
              UrgencyLabel(level: n.urgency, text: l.urgency(n.urgency)),
            ),
            (l.volDistance, KvText(l.needDist(n.id))),
          ],
        ),
        if (vm.busyWithOther) NoteLine(icon: AppIconName.info, text: l.volBusy),
      ],
      pinned: [
        if (vm.hasThisTask)
          AppButton(
            label: l.volToTask,
            icon: AppIconName.clipboard,
            size: AppButtonSize.xl,
            onPressed: () => context.push('/vol/task'),
          )
        else
          AppButton(
            label: l.volAccept,
            icon: AppIconName.checkCircle,
            size: AppButtonSize.xl,
            onPressed: vm.busyWithOther
                ? null
                : () {
                    vm.accept();
                    context.pushReplacement('/vol/task');
                  },
          ),
        AppButton(
          label: l.volBack,
          variant: AppButtonVariant.outline,
          onPressed: () => context.go('/vol'),
        ),
      ],
    );
  }
}
