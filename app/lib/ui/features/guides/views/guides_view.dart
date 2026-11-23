import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../../data/repositories/catalog_repository.dart';
import '../../../../data/repositories/connectivity_repository.dart';
import '../../../../domain/models/models.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/tokens.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/layout.dart';
import '../../../core/widgets/parts.dart';

class GuidesView extends StatelessWidget {
  const GuidesView({super.key});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final catalogs = context.watch<CatalogRepository>();
    final connectivity = context.watch<ConnectivityRepository>();
    final offline = connectivity.status == NetworkStatus.offline;
    final failed = catalogs.lastError != null;
    final statusTone = offline || failed
        ? Tone.warn
        : catalogs.refreshing
        ? Tone.info
        : Tone.ok;
    final statusIcon = failed
        ? AppIconName.alert
        : offline
        ? AppIconName.wifiOff
        : catalogs.refreshing
        ? AppIconName.info
        : AppIconName.checkCircle;
    final statusLabel = failed
        ? l.guidesStale
        : offline
        ? l.guidesOffline
        : catalogs.refreshing
        ? l.guidesSyncing
        : l.guidesOnline;

    return ScreenBody(
      children: [
        ScreenHeader(title: l.guidesTitle, onBack: () => context.go('/tools')),
        Align(
          alignment: AlignmentDirectional.centerStart,
          child: AppChip(
            tone: statusTone,
            icon: statusIcon,
            label: statusLabel,
          ),
        ),
        Text(l.guidesOfflineNote, style: context.body),
        AppButton(
          label: l.guidesRefresh,
          icon: AppIconName.sync,
          variant: AppButtonVariant.outline,
          busy: catalogs.refreshing,
          onPressed: () => catalogs.refreshInBackground(),
        ),
        SectionTitle(l.guidesList),
        if (catalogs.guides.isEmpty && catalogs.refreshing)
          AppCard(
            child: Row(
              children: [
                const SizedBox(
                  width: IconSizes.md,
                  height: IconSizes.md,
                  child: CircularProgressIndicator(strokeWidth: 3),
                ),
                const SizedBox(width: Sp.s3),
                Expanded(child: Text(l.guidesLoading, style: context.body)),
              ],
            ),
          )
        else if (failed)
          AppBanner(
            tone: Tone.warn,
            icon: AppIconName.alert,
            body: l.guidesLoadFailed,
          ),
        if (catalogs.guides.isEmpty && !catalogs.refreshing && !failed)
          AppCard(child: Text(l.guidesEmpty, style: context.body))
        else
          for (final guide in catalogs.guides) _GuideCard(guide: guide),
      ],
    );
  }
}

class _GuideCard extends StatefulWidget {
  const _GuideCard({required this.guide});

  final EmergencyGuide guide;

  @override
  State<_GuideCard> createState() => _GuideCardState();
}

class _GuideCardState extends State<_GuideCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return AppCard(
      flush: true,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Semantics(
            button: true,
            expanded: _expanded,
            label: widget.guide.title,
            child: ExcludeSemantics(
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(Radii.sm),
                  onTap: () => setState(() => _expanded = !_expanded),
                  child: Padding(
                    padding: const EdgeInsets.all(Sp.s3),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      spacing: Sp.s3,
                      children: [
                        AppIcon(AppIconName.clipboard, color: c.infoText),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            spacing: Sp.s1,
                            children: [
                              Text(
                                widget.guide.title,
                                style: context.body.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              Text(widget.guide.category, style: context.hint),
                            ],
                          ),
                        ),
                        AppIcon(
                          _expanded ? AppIconName.minus : AppIconName.plus,
                          color: c.textMuted,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          if (_expanded)
            Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(
                Sp.s3,
                0,
                Sp.s3,
                Sp.s3,
              ),
              child: Text(widget.guide.content, style: context.body),
            ),
        ],
      ),
    );
  }
}
