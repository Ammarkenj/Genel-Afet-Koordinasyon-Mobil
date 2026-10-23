import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../data/repositories/connectivity_repository.dart';
import '../../../../domain/models/models.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../core/labels.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/brand.dart';
import '../../../core/widgets/layout.dart';
import '../../../core/widgets/parts.dart';
import '../../report/view_models/report_view_model.dart';
import '../../tools/view_models/tools_view_model.dart';
import '../../volunteer/views/volunteer_entry_row.dart';
import 'afad_sheet.dart';

/// Home: one big red "I need help", one green "I am safe", quick tools, volunteering, last quake, recent reports.
class HomeView extends StatelessWidget {
  const HomeView({super.key});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final net = context.watch<ConnectivityRepository>().status;
    final reports = context.watch<ReportViewModel>();
    final tools = context.watch<ToolsViewModel>();
    final queued = reports.queuedCount;
    final c = context.colors;

    return ScreenBody(
      children: [
        ConstrainedBox(
          constraints: const BoxConstraints(minHeight: Tap.min),
          child: Row(
            children: [
              const Expanded(
                child: Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: BrandMark(),
                ),
              ),
              AppIconButton(
                icon: AppIconName.bell,
                semanticLabel: l.homeAlerts,
                onPressed: () => showAfadSheet(context),
              ),
            ],
          ),
        ),
        AppBanner(
          tone: networkTone(net),
          icon: networkIcon(net),
          title: l.network(net),
          body: l.networkDesc(net),
          extra: queued > 0
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
                        l.netQueued(queued),
                        style: context.label.copyWith(
                          fontWeight: FontWeight.w700,
                          color: c.warnText,
                        ),
                      ),
                    ),
                  ],
                )
              : null,
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: Sp.s3,
          children: [
            Semantics(
              header: true,
              child: Text(l.homePrompt, style: context.title),
            ),
            AppButton(
              label: l.homeHelp,
              sublabel: l.homeHelpSub,
              icon: AppIconName.lifebuoy,
              variant: AppButtonVariant.danger,
              size: AppButtonSize.xxl,
              onPressed: () => context.push('/select'),
            ),
            AppButton(
              label: l.homeSafe,
              icon: AppIconName.shieldCheck,
              variant: AppButtonVariant.safe,
              size: AppButtonSize.xl,
              onPressed: () {
                HapticFeedback.mediumImpact();
                reports.sendSafe();
                context.push('/status');
              },
            ),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: Sp.s2,
          children: [
            SectionTitle(l.homeQuick),
            // IntrinsicHeight: "stretch" needs a bounded height, so the three tiles match the tallest one.
            IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: Sp.s2,
                children: [
                  Expanded(
                    child: _ToolTile(
                      icon: AppIconName.siren,
                      label: l.homeSiren,
                      state: tools.siren ? l.commonOn : l.commonOff,
                      pressed: tools.siren,
                      onTap: tools.toggleSiren,
                    ),
                  ),
                  Expanded(
                    child: _ToolTile(
                      icon: AppIconName.flash,
                      label: l.homeFlash,
                      state: tools.flash ? l.commonOn : l.commonOff,
                      pressed: tools.flash,
                      onTap: tools.toggleFlash,
                    ),
                  ),
                  Expanded(
                    child: _ToolTile(
                      icon: AppIconName.phone,
                      label: l.homeCall,
                      danger: true,
                      onTap: () => showToast(context, l.toastCall),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const VolunteerEntryRow(),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: Sp.s2,
            children: [
              SectionTitle(l.homeAfadTitle, trailing: AppTag(l.commonSample)),
              Row(
                spacing: Sp.s4,
                children: [
                  Container(
                    // Minimum 76x76; it grows with large text instead of overflowing.
                    constraints: const BoxConstraints(
                      minWidth: 76,
                      minHeight: 76,
                    ),
                    padding: const EdgeInsets.all(Sp.s2),
                    decoration: BoxDecoration(
                      color: c.warnSoft,
                      borderRadius: BorderRadius.circular(Radii.md),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '5.4',
                          style: context.title.copyWith(
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                            height: 1.1,
                            color: c.warnText,
                            fontFeatures: const [FontFeature.tabularFigures()],
                          ),
                        ),
                        Text(
                          l.homeAfadMag,
                          style: context.caption.copyWith(
                            fontWeight: FontWeight.w700,
                            color: c.warnText,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l.homeAfadPlace,
                          style: context.body.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(l.homeAfadMeta, style: context.hint),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: Sp.s2,
          children: [
            SectionTitle(l.homeRecent),
            if (reports.recent.isEmpty)
              Text(l.homeNoReports, style: context.hint)
            else
              for (final r in reports.recent) _RecentRow(report: r),
          ],
        ),
      ],
    );
  }
}

class _RecentRow extends StatelessWidget {
  const _RecentRow({required this.report});

  final Report report;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final style = deliveryStyle(report.state);
    return ListRowButton(
      leading: AppIcon(
        report.kind == ReportKind.help
            ? AppIconName.lifebuoy
            : AppIconName.shieldCheck,
      ),
      title:
          l.kind(report.kind) +
          (report.type == null ? '' : ' · ${l.incident(report.type!)}'),
      subtitle: report.time,
      chip: AppChip(
        tone: style.tone,
        icon: style.icon,
        label: l.delivery(report.state),
      ),
      onTap: () {
        context.read<ReportViewModel>().open(report.id);
        context.push('/status');
      },
    );
  }
}

/// Square tool button (siren, flash, 112). Pressed state = fill + word "Açık", not colour alone.
class _ToolTile extends StatelessWidget {
  const _ToolTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.state,
    this.pressed = false,
    this.danger = false,
  });

  final AppIconName icon;
  final String label;
  final String? state;
  final bool pressed;
  final bool danger;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final fg = danger ? c.dangerText : (pressed ? c.infoText : c.text);
    return Semantics(
      button: true,
      toggled: state == null ? null : pressed,
      label: state == null ? label : '$label, $state',
      excludeSemantics: true,
      child: Material(
        color: pressed ? c.infoSoft : c.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Radii.md),
          side: BorderSide(
            color: danger
                ? c.dangerAccent
                : (pressed ? c.info : c.borderStrong),
            width: 2,
          ),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(Radii.md),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 92),
            child: Padding(
              padding: const EdgeInsets.all(Sp.s2),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                spacing: 4,
                children: [
                  AppIcon(icon, color: fg),
                  Text(
                    label,
                    textAlign: TextAlign.center,
                    style: context.label.copyWith(
                      fontWeight: FontWeight.w700,
                      color: fg,
                    ),
                  ),
                  if (state != null)
                    Text(
                      state!,
                      style: context.caption.copyWith(
                        color: pressed ? c.infoText : c.textMuted,
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
