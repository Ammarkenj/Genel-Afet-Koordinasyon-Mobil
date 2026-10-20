import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../data/repositories/connectivity_repository.dart';
import '../../../../domain/models/models.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../core/labels.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/layout.dart';
import '../../../core/widgets/parts.dart';
import '../view_models/volunteer_view_model.dart';

/// Volunteer hub: availability switch, role summary, the active task and nearby needs.
/// Offline it shows the last matched needs and the accepted task waits as "Bekliyor".
class VolunteerHubView extends StatelessWidget {
  const VolunteerHubView({super.key});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final vm = context.watch<VolunteerViewModel>();
    final net = context.watch<ConnectivityRepository>().status;
    final task = vm.task;
    final c = context.colors;

    return ScreenBody(
      children: [
        ScreenHeader(title: l.volHubTitle, onBack: () => context.go(vm.origin)),
        if (net != NetworkStatus.online)
          AppBanner(
            tone: Tone.warn,
            icon: networkIcon(net),
            title: l.network(net),
            body: net == NetworkStatus.offline
                ? l.volOfflineDesc
                : l.netWeakDesc,
            extra: task != null && task.state == DeliveryState.queued
                ? Row(
                    children: [
                      AppIcon(
                        AppIconName.clock,
                        size: IconSizes.sm,
                        color: c.warnText,
                      ),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          l.volTaskWaiting,
                          style: Theme.of(context).textTheme.labelLarge!
                              .copyWith(
                                fontWeight: FontWeight.w700,
                                color: c.warnText,
                              ),
                        ),
                      ),
                    ],
                  )
                : null,
          ),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: Sp.s2,
            children: [
              SectionTitle(l.volStatus),
              SwitchRow(
                title: l.volAvailable,
                description: vm.available
                    ? l.volAvailableOn
                    : l.volAvailableOff,
                value: vm.available,
                stateLabel: vm.available ? l.commonOn : l.commonOff,
                onChanged: vm.setAvailable,
              ),
              KvCard(
                card: false,
                rows: [
                  (l.volRole, KvText(l.roleName(vm.role))),
                  (
                    l.volCertLabel,
                    vm.hasCertificate
                        ? AppChip(
                            tone: Tone.ok,
                            icon: AppIconName.checkCircle,
                            label: l.volCertYes,
                          )
                        : AppChip(
                            tone: Tone.info,
                            icon: AppIconName.info,
                            label: l.volCertNo,
                          ),
                  ),
                  (
                    l.volLocShare,
                    vm.available
                        ? AppChip(
                            tone: Tone.info,
                            icon: AppIconName.pin,
                            label: l.commonOn,
                          )
                        : AppChip(
                            tone: Tone.warn,
                            icon: AppIconName.pin,
                            label: l.commonOff,
                          ),
                  ),
                ],
              ),
            ],
          ),
        ),
        if (task != null)
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: Sp.s2,
            children: [
              SectionTitle(l.volActiveTask),
              ListRowButton(
                leading: AppIcon(
                  AppIconName.clipboard,
                  size: IconSizes.lg,
                  color: c.infoText,
                ),
                title: l.needName(task.need),
                subtitle: '${l.volAssigned} · ${task.time}',
                extra: _TaskChip(task: task),
                chevron: true,
                onTap: () => context.push('/vol/task'),
              ),
            ],
          ),
        if (!vm.available)
          NoteLine(icon: AppIconName.info, text: l.volUnavailable)
        else
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: Sp.s2,
            children: [
              SectionTitle(l.volNeeds, trailing: AppTag(l.commonSample)),
              for (final n in vm.needs)
                ListRowButton(
                  leading: AppIcon(
                    needIcon(n.id),
                    size: IconSizes.lg,
                    color: c.infoText,
                  ),
                  title: l.needName(n.id),
                  subtitle: l.needDist(n.id),
                  extra: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    spacing: 4,
                    children: [
                      UrgencyLabel(
                        level: n.urgency,
                        text: '${l.volUrgency}: ${l.urgency(n.urgency)}',
                      ),
                      if (task != null && task.need == n.id)
                        _TaskChip(task: task),
                    ],
                  ),
                  chevron: true,
                  onTap: () {
                    vm.openNeed(n.id);
                    context.push('/vol/need');
                  },
                ),
            ],
          ),
      ],
    );
  }
}

class _TaskChip extends StatelessWidget {
  const _TaskChip({required this.task});

  final VolunteerTask task;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    if (task.done) {
      return AppChip(
        tone: Tone.ok,
        icon: AppIconName.checkCircle,
        label: l.volCompleted,
      );
    }
    final s = deliveryStyle(task.state);
    return AppChip(tone: s.tone, icon: s.icon, label: l.delivery(task.state));
  }
}
