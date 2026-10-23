import 'dart:ui' as ui;

import 'package:flutter/material.dart';
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
import '../../../core/widgets/layout.dart';
import '../../../core/widgets/parts.dart';
import '../view_models/map_view_model.dart';

/// Assembly areas with a walking route. The map is a drawn placeholder; the offline tile map comes later.
class MapView extends StatelessWidget {
  const MapView({super.key});

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final vm = context.watch<MapViewModel>();
    final offline =
        context.watch<ConnectivityRepository>().status == NetworkStatus.offline;
    final a = vm.area;
    final walk = l.mapWalk(a.meters, a.minutes);

    return ScreenBody(
      children: [
        ScreenHeader(title: l.mapTitle),
        Align(
          alignment: AlignmentDirectional.centerStart,
          child: offline
              ? AppChip(
                  tone: Tone.warn,
                  icon: AppIconName.wifiOff,
                  label: l.mapOffline,
                )
              : AppChip(
                  tone: Tone.ok,
                  icon: AppIconName.checkCircle,
                  label: l.mapOnline,
                ),
        ),
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
                  child: CustomPaint(
                    painter: _MapPainter(
                      colors: context.colors,
                      selected: vm.selected,
                      route: vm.routeOn,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: Sp.s2,
            children: [
              // Wrap: at large text the two tags go on separate lines instead of overflowing.
              Wrap(
                alignment: WrapAlignment.spaceBetween,
                spacing: Sp.s2,
                runSpacing: Sp.s1,
                children: [
                  AppTag(vm.selected == 0 ? l.mapNearest : l.mapSelected),
                  AppTag(l.commonSample),
                ],
              ),
              Row(
                children: [
                  NumberBadge(a.number),
                  const SizedBox(width: Sp.s2),
                  Expanded(
                    child: Semantics(
                      header: true,
                      child: Text(l.areaName(a.number), style: context.title),
                    ),
                  ),
                ],
              ),
              Text(walk, style: context.bodyLg),
              if (vm.routeOn)
                NoteLine(icon: AppIconName.route, text: l.mapRouteOn),
              AppButton(
                label: vm.routeOn ? l.mapStop : l.mapStart,
                icon: AppIconName.route,
                variant: vm.routeOn
                    ? AppButtonVariant.outline
                    : AppButtonVariant.info,
                onPressed: vm.toggleRoute,
              ),
            ],
          ),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: Sp.s2,
          children: [
            SectionTitle(l.mapAll),
            for (var i = 0; i < MapViewModel.areas.length; i++)
              ListRowButton(
                leading: NumberBadge(MapViewModel.areas[i].number),
                title: l.areaName(MapViewModel.areas[i].number),
                subtitle: l.mapWalk(
                  MapViewModel.areas[i].meters,
                  MapViewModel.areas[i].minutes,
                ),
                selected: i == vm.selected,
                onTap: () => vm.select(i),
              ),
          ],
        ),
      ],
    );
  }
}

/// Draws the 340x260 placeholder map in theme colours: roads, a park, the three areas, "you are here", the route.
class _MapPainter extends CustomPainter {
  _MapPainter({
    required this.colors,
    required this.selected,
    required this.route,
  });

  final AppColors colors;
  final int selected;
  final bool route;

  static const _pins = [Offset(250, 70), Offset(70, 60), Offset(270, 210)];
  static const _routes = [
    [Offset(120, 170), Offset(120, 120), Offset(250, 120), Offset(250, 70)],
    [Offset(120, 170), Offset(120, 120), Offset(70, 120), Offset(70, 60)],
    [Offset(120, 170), Offset(120, 210), Offset(270, 210)],
  ];
  static const _you = Offset(120, 170);

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

    if (route) {
      final path = Path()
        ..moveTo(_routes[selected].first.dx, _routes[selected].first.dy);
      for (final p in _routes[selected].skip(1)) {
        path.lineTo(p.dx, p.dy);
      }
      final dots = Paint()
        ..color = colors.info
        ..style = PaintingStyle.stroke
        ..strokeWidth = 5
        ..strokeCap = StrokeCap.round;
      for (final metric in path.computeMetrics()) {
        for (var d = 0.0; d < metric.length; d += 11) {
          final seg = metric.extractPath(d, d + 1);
          canvas.drawPath(seg, dots);
        }
      }
    }

    for (var i = 0; i < _pins.length; i++) {
      final isSelected = i == selected;
      final r = isSelected ? 17.0 : 14.0;
      canvas.drawCircle(_pins[i], r, Paint()..color = colors.safe);
      canvas.drawCircle(
        _pins[i],
        r,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = isSelected ? 3 : 2
          ..color = isSelected ? colors.text : colors.surface,
      );
      final tp = TextPainter(
        text: TextSpan(
          text: '${i + 1}',
          style: TextStyle(
            fontFamily: 'Roboto',
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: colors.onSafe,
          ),
        ),
        textDirection: ui.TextDirection.ltr,
      )..layout();
      tp.paint(canvas, _pins[i] - Offset(tp.width / 2, tp.height / 2));
    }

    canvas.drawCircle(
      _you,
      14,
      Paint()..color = colors.info.withValues(alpha: 0.25),
    );
    canvas.drawCircle(_you, 7, Paint()..color = colors.info);
    canvas.drawCircle(
      _you,
      7,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2
        ..color = colors.surface,
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(_MapPainter old) =>
      old.selected != selected || old.route != route || old.colors != colors;
}
