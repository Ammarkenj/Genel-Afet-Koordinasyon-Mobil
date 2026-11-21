import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

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
import '../view_models/map_view_model.dart';

/// Shows the cached shelter catalog; the drawing is only a schematic preview.
class MapView extends StatelessWidget {
  const MapView({super.key});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final vm = context.watch<MapViewModel>();
    final offline =
        context.watch<ConnectivityRepository>().status == NetworkStatus.offline;
    final shelters = vm.shelters;
    final failed = vm.lastError != null;
    final statusTone = offline || failed
        ? Tone.warn
        : vm.refreshing
        ? Tone.info
        : Tone.ok;
    final statusIcon = failed
        ? AppIconName.alert
        : offline
        ? AppIconName.wifiOff
        : vm.refreshing
        ? AppIconName.info
        : AppIconName.checkCircle;
    final statusLabel = failed
        ? l.mapStale
        : offline
        ? l.mapOffline
        : vm.refreshing
        ? l.mapSyncing
        : l.mapOnline;

    return ScreenBody(
      children: [
        ScreenHeader(title: l.mapTitle),
        Align(
          alignment: AlignmentDirectional.centerStart,
          child: AppChip(
            tone: statusTone,
            icon: statusIcon,
            label: statusLabel,
          ),
        ),
        NoteLine(icon: AppIconName.info, text: l.mapSchemaNote),
        Semantics(
          image: true,
          label: l.mapAlt,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(Radii.md),
            child: DecoratedBox(
              decoration: BoxDecoration(
                border: Border.all(color: context.colors.borderStrong),
                borderRadius: BorderRadius.circular(Radii.md),
              ),
              child: AspectRatio(
                aspectRatio: 340 / 260,
                child: ExcludeSemantics(
                  child: CustomPaint(painter: _MapPainter(context.colors)),
                ),
              ),
            ),
          ),
        ),
        SectionTitle(l.mapAll),
        if (shelters.isEmpty && vm.refreshing)
          AppCard(
            child: Row(
              children: [
                const SizedBox(
                  width: IconSizes.md,
                  height: IconSizes.md,
                  child: CircularProgressIndicator(strokeWidth: 3),
                ),
                const SizedBox(width: Sp.s3),
                Expanded(child: Text(l.mapLoading, style: context.body)),
              ],
            ),
          )
        else if (failed)
          AppBanner(
            tone: Tone.warn,
            icon: AppIconName.alert,
            body: l.mapLoadFailed,
            extra: Align(
              alignment: AlignmentDirectional.centerStart,
              child: AppButton(
                label: l.mapRetry,
                variant: AppButtonVariant.ghost,
                alignStart: true,
                onPressed: vm.refresh,
              ),
            ),
          ),
        if (shelters.isEmpty && !vm.refreshing && !failed)
          AppCard(child: Text(l.mapEmpty, style: context.body))
        else
          for (final shelter in shelters) _ShelterCard(shelter: shelter),
      ],
    );
  }
}

class _ShelterCard extends StatelessWidget {
  const _ShelterCard({required this.shelter});

  final Shelter shelter;

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final capacity = shelter.capacity;
    final features = shelter.features;

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: Sp.s2,
        children: [
          Text(shelter.name, style: context.title),
          Text(shelter.category, style: context.body),
          Text(
            l.mapCoordinates(
              '${shelter.latitude.toStringAsFixed(5)}, '
              '${shelter.longitude.toStringAsFixed(5)}',
            ),
            style: context.label,
          ),
          if (capacity != null)
            Text(l.mapCapacity(capacity), style: context.label),
          if (features != null && features.trim().isNotEmpty)
            Text(l.mapFeatures(features), style: context.label),
        ],
      ),
    );
  }
}

/// An illustrative street pattern only; it deliberately contains no location markers.
class _MapPainter extends CustomPainter {
  _MapPainter(this.colors);

  final AppColors colors;

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 340, size.height / 260);

    canvas.drawRect(
      const Rect.fromLTWH(0, 0, 340, 260),
      Paint()..color = colors.surface2,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        const Rect.fromLTWH(140, 136, 92, 58),
        const Radius.circular(8),
      ),
      Paint()..color = colors.safeSoft,
    );

    final road = Paint()
      ..color = colors.surface
      ..style = PaintingStyle.stroke
      ..strokeWidth = 12;
    for (final y in [40.0, 120.0, 210.0]) {
      canvas.drawLine(Offset(0, y), Offset(340, y), road);
    }
    for (final x in [70.0, 120.0, 250.0]) {
      canvas.drawLine(Offset(x, 0), Offset(x, 260), road);
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(_MapPainter old) => old.colors != colors;
}
