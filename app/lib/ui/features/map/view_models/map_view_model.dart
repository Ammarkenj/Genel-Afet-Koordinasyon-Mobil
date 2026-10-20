import 'package:flutter/foundation.dart';

import '../../../../domain/models/models.dart';

/// Assembly areas and the walking route. Sample data; the offline map layer and routing come later.
class MapViewModel extends ChangeNotifier {
  static const areas = [
    AssemblyArea(number: 1, meters: 450, minutes: 6),
    AssemblyArea(number: 2, meters: 900, minutes: 12),
    AssemblyArea(number: 3, meters: 1400, minutes: 18),
  ];

  int _selected = 0;
  bool _routeOn = false;

  int get selected => _selected;
  bool get routeOn => _routeOn;
  AssemblyArea get area => areas[_selected];

  void select(int index) {
    _selected = index;
    notifyListeners();
  }

  void toggleRoute() {
    _routeOn = !_routeOn;
    notifyListeners();
  }
}
