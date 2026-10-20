import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../domain/models/models.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../core/labels.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/layout.dart';
import '../../../core/widgets/parts.dart';
import '../view_models/report_view_model.dart';

/// Report status. Sent, saved on the device (offline) or sending (weak network): never an "error".
class StatusView extends StatelessWidget {
  const StatusView({super.key});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final vm = context.watch<ReportViewModel>();
    final r = vm.current;
    if (r == null) {
      return ScreenBody(
        children: [
          ScreenHeader(
            title: l.screenStatus,
            onBack: () => context.go('/home'),
          ),
          Text(l.statusNone, style: context.bodyLg),
          AppButton(label: l.statusHome, onPressed: () => context.go('/home')),
        ],
      );
    }

    final style = deliveryStyle(r.state);
    final (title, desc) = switch (r.state) {
      DeliveryState.sent => (l.statusSentTitle, l.statusSentDesc),
      DeliveryState.queued => (l.statusQueuedTitle, l.statusQueuedDesc),
      DeliveryState.sending => (l.statusSendingTitle, l.statusSendingDesc),
    };
    final kindChip = AppChip(
      tone: r.kind == ReportKind.help ? Tone.danger : Tone.ok,
      icon: r.kind == ReportKind.help
          ? AppIconName.lifebuoy
          : AppIconName.shieldCheck,
      label: l.kind(r.kind),
    );

    return ScreenBody(
      children: [
        ResultHeader(
          tone: style.tone,
          icon: style.icon,
          title: title,
          description: desc,
          note: r.auto ? l.statusAuto : null,
        ),
        KvCard(
          rows: [
            (l.statusKind, kindChip),
            if (r.type != null) (l.statusType, KvText(l.incident(r.type!))),
            (l.statusTime, KvText(r.time, ltr: true)),
            (l.statusLocation, const KvText('38.6748, 39.2225', ltr: true)),
            (
              l.statusDelivery,
              AppChip(
                tone: style.tone,
                icon: style.icon,
                label: l.delivery(r.state),
              ),
            ),
          ],
        ),
        if (r.kind == ReportKind.help) _Details(report: r),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: Sp.s3,
          children: [
            AppButton(
              label: l.statusShowArea,
              icon: AppIconName.pin,
              onPressed: () => context.go('/map'),
            ),
            AppButton(
              label: l.statusHome,
              variant: AppButtonVariant.outline,
              onPressed: () => context.go('/home'),
            ),
            AppButton(
              label: l.statusUndo,
              variant: AppButtonVariant.ghostDanger,
              onPressed: () => _confirmUndo(context),
            ),
          ],
        ),
      ],
    );
  }

  /// No confirmation before help is sent; a mistaken tap is corrected here, after sending.
  Future<void> _confirmUndo(BuildContext context) {
    final l = AppLocalizations.of(context);
    final vm = context.read<ReportViewModel>();
    final router = GoRouter.of(context);
    return showAppSheet<void>(
      context,
      title: l.confirmTitle,
      message: l.confirmDesc,
      actions: [
        Builder(
          builder: (ctx) => Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: 12,
            children: [
              AppButton(
                label: l.confirmNo,
                variant: AppButtonVariant.outline,
                onPressed: () => Navigator.of(ctx).pop(),
              ),
              AppButton(
                label: l.confirmYes,
                variant: AppButtonVariant.danger,
                onPressed: () {
                  Navigator.of(ctx).pop();
                  vm.undo();
                  router.go('/home');
                  if (context.mounted) {
                    showToast(context, l.toastReportCancelled);
                  }
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Details extends StatelessWidget {
  const _Details({required this.report});

  final Report report;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final vm = context.read<ReportViewModel>();
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: Sp.s3,
        children: [
          SectionTitle(l.statusMore),
          _YesNoRow(
            label: l.statusInjured,
            value: report.injured,
            onYes: () => vm.setInjured(true),
            onNo: () => vm.setInjured(false),
          ),
          _YesNoRow(
            label: l.statusTrapped,
            value: report.trapped,
            onYes: () => vm.setTrapped(true),
            onNo: () => vm.setTrapped(false),
          ),
          _Stepper(
            label: l.statusPeople,
            value: report.people,
            onMinus: () => vm.changePeople(-1),
            onPlus: () => vm.changePeople(1),
          ),
        ],
      ),
    );
  }
}

class _YesNoRow extends StatelessWidget {
  const _YesNoRow({
    required this.label,
    required this.value,
    required this.onYes,
    required this.onNo,
  });

  final String label;
  final bool? value;
  final VoidCallback onYes;
  final VoidCallback onNo;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Text(
      label,
      style: context.body.copyWith(fontWeight: FontWeight.w500),
    );
    final pair = Row(
      mainAxisSize: MainAxisSize.min,
      spacing: Sp.s2,
      children: [
        _Answer(label: l.commonYes, selected: value == true, onTap: onYes),
        _Answer(label: l.commonNo, selected: value == false, onTap: onNo),
      ],
    );
    return isLargeText(context)
        ? Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: Sp.s2,
            children: [text, pair],
          )
        : Row(
            children: [
              Expanded(child: text),
              const SizedBox(width: Sp.s3),
              pair,
            ],
          );
  }
}

class _Answer extends StatelessWidget {
  const _Answer({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final fg = selected ? c.infoText : c.text;
    return Semantics(
      button: true,
      selected: selected,
      label: label,
      excludeSemantics: true,
      child: Material(
        color: selected ? c.infoSoft : c.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Radii.sm),
          side: BorderSide(color: selected ? c.info : c.borderStrong, width: 2),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(Radii.sm),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minWidth: 72, minHeight: Tap.min),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: Sp.s3),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                spacing: 6,
                children: [
                  if (selected)
                    AppIcon(AppIconName.check, size: IconSizes.sm, color: fg),
                  Text(
                    label,
                    style: context.body.copyWith(
                      fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                      color: fg,
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

class _Stepper extends StatelessWidget {
  const _Stepper({
    required this.label,
    required this.value,
    required this.onMinus,
    required this.onPlus,
  });

  final String label;
  final int value;
  final VoidCallback onMinus;
  final VoidCallback onPlus;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final text = Text(
      label,
      style: context.body.copyWith(fontWeight: FontWeight.w500),
    );
    final stepper = Row(
      mainAxisSize: MainAxisSize.min,
      spacing: Sp.s2,
      children: [
        AppIconButton(
          icon: AppIconName.minus,
          outlined: true,
          semanticLabel: l.statusDecrease,
          onPressed: value <= 1 ? null : onMinus,
        ),
        Semantics(
          liveRegion: true,
          label: '$label $value',
          excludeSemantics: true,
          child: SizedBox(
            width: 36,
            child: Text(
              '$value',
              textAlign: TextAlign.center,
              style: context.title.copyWith(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                height: 1,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ),
        ),
        AppIconButton(
          icon: AppIconName.plus,
          outlined: true,
          semanticLabel: l.statusIncrease,
          onPressed: onPlus,
        ),
      ],
    );
    return isLargeText(context)
        ? Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: Sp.s2,
            children: [text, stepper],
          )
        : Row(
            children: [
              Expanded(child: text),
              const SizedBox(width: Sp.s3),
              stepper,
            ],
          );
  }
}
