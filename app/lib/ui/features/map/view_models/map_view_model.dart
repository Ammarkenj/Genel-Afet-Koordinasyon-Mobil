import 'package:flutter/foundation.dart';

import '../../../../data/repositories/assembly_areas_repository.dart';
import '../../../../domain/models/models.dart';

/// Assembly areas and the walking route. The areas come from the repository (Firestore in the real app, three
/// samples in tests); the offline map layer and routing come later.
class MapViewModel extends ChangeNotifier {
  MapViewModel(this._repo) {
    _repo.addListener(_onAreas);
  }

  final AssemblyAreasRepository _repo;

  int _selected = 0;
  bool _routeOn = false;

  List<AssemblyArea> get areas => _repo.areas;
  bool get isSample => _repo.isSample;
  bool get isEmpty => areas.isEmpty;

  /// Index of the selected area, kept inside the list when the list changes.
  int get selected => areas.isEmpty ? 0 : _selected.clamp(0, areas.length - 1);
  bool get routeOn => _routeOn;

  /// The selected area, or null while there are none.
  AssemblyArea? get area => areas.isEmpty ? null : areas[selected];

  void _onAreas() => notifyListeners();

  void select(int index) {
    _selected = index;
    notifyListeners();
  }

  void toggleRoute() {
    _routeOn = !_routeOn;
    notifyListeners();
  }

  @override
  void dispose() {
    _repo.removeListener(_onAreas);
    super.dispose();
  }
}
