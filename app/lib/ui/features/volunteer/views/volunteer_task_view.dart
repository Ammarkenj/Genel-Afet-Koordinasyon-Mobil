import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../domain/models/models.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../core/labels.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/layout.dart';
import '../../../core/widgets/parts.dart';
import '../view_models/volunteer_view_model.dart';
import 'volunteer_error_notice.dart';

/// Accepted task (VolunteerAssignments). Only the demo repository queues tasks offline.
/// Completing it cannot be undone, so it asks first; the safe answer comes first.
class VolunteerTaskView extends StatelessWidget {
  const VolunteerTaskView({super.key});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final vm = context.watch<VolunteerViewModel>();
    final task = vm.task;
    if (task == null) {
      return ScreenBody(
        children: [
          ScreenHeader(
            title: l.screenVolTask,
            onBack: () => context.go('/vol'),
          ),
          if (vm.errorCode != null)
            VolunteerErrorNotice(code: vm.errorCode!, onRetry: vm.load),
          Text(l.volNoTask, style: Theme.of(context).textTheme.bodyLarge),
          AppButton(label: l.volHubBack, onPressed: () => context.go('/vol')),
        ],
      );
    }

    final style = deliveryStyle(task.state);
    final (title, desc) = task.done
        ? (l.volTaskDone, l.volTaskDoneDesc)
        : switch (task.state) {
            DeliveryState.sent => (l.volTaskSent, l.volTaskSentDesc),
            DeliveryState.queued => (l.volTaskQueued, l.volTaskQueuedDesc),
            DeliveryState.sending => (l.volTaskSending, l.volTaskSendingDesc),
          };
    return ScreenBody(
      children: [
        if (vm.errorCode != null)
          VolunteerErrorNotice(code: vm.errorCode!, onRetry: vm.load),
        ResultHeader(
          tone: task.done ? Tone.ok : style.tone,
          icon: task.done ? AppIconName.checkCircle : style.icon,
          title: title,
          description: desc,
        ),
        KvCard(
          rows: [
            (l.volNeedType, KvText(l.needName(task.need))),
            (l.volEvent, KvText(l.volunteerEventName(task.eventTitle))),
            (l.volAssigned, KvText(task.time, ltr: true)),
            (
              l.statusDelivery,
              AppChip(
                tone: style.tone,
                icon: style.icon,
                label: l.delivery(task.state),
              ),
            ),
            (
              l.volState,
              task.done
                  ? AppChip(
                      tone: Tone.ok,
                      icon: AppIconName.checkCircle,
                      label: l.volCompleted,
                    )
                  : AppChip(
                      tone: Tone.info,
                      icon: AppIconName.route,
                      label: l.volInProgress,
                    ),
            ),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: Sp.s3,
          children: [
            AppButton(
              label: l.volRoute,
              icon: AppIconName.route,
              onPressed: vm.busy ? null : () => context.go('/map'),
            ),
            if (!task.done)
              AppButton(
                label: l.volComplete,
                icon: AppIconName.check,
                variant: AppButtonVariant.outline,
                busy: vm.busy,
                onPressed: vm.busy ? null : () => _confirmDone(context),
              ),
            AppButton(
              label: l.volHubBack,
              variant: AppButtonVariant.ghost,
              onPressed: () => context.go('/vol'),
            ),
          ],
        ),
      ],
    );
  }

  Future<void> _confirmDone(BuildContext context) {
    final l = AppLocalizations.of(context);
    final vm = context.read<VolunteerViewModel>();
    return showAppSheet<void>(
      context,
      title: l.volDoneConfirmTitle,
      message: l.volDoneConfirmDesc,
      actions: [
        Builder(
          builder: (ctx) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [
              AppButton(
                label: l.volDoneNo,
                variant: AppButtonVariant.outline,
                onPressed: () => Navigator.of(ctx).pop(),
              ),
              AppButton(
                label: l.volDoneYes,
                icon: AppIconName.check,
                onPressed: () {
                  Navigator.of(ctx).pop();
                  vm.complete();
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}
