import 'package:flutter/foundation.dart';

import '../../../../data/repositories/reports_repository.dart';
import '../../../../domain/models/models.dart';

/// "I need help" / "I am safe" and the report status screen.
/// Two taps to ask for help: "Yardım İstiyorum" then the incident type; the report is sent right away and the
/// optional details (injured, trapped, people) are filled in afterwards.
class ReportViewModel extends ChangeNotifier {
  ReportViewModel(this._reports) {
    _reports.addListener(notifyListeners);
  }

  final ReportsRepository _reports;
  int? _currentId;

  List<Report> get recent => _reports.reports.reversed.take(3).toList();
  int get queuedCount => _reports.queuedCount;
  Report? get current => _currentId == null ? null : _reports.byId(_currentId!);

  Report sendHelp(IncidentType type) => _make(ReportKind.help, type);

  Report sendSafe() => _make(ReportKind.safe, null);

  Report _make(ReportKind kind, IncidentType? type) {
    final report = _reports.create(kind: kind, type: type);
    _currentId = report.id;
    notifyListeners();
    return report;
  }

  void open(int id) {
    _currentId = id;
    notifyListeners();
  }

  /// Takes back a report that was sent by mistake.
  void undo() {
    final id = _currentId;
    if (id == null) return;
    _reports.remove(id);
    _currentId = null;
  }

  void setInjured(bool value) {
    final r = current;
    if (r == null) return;
    // Tapping the chosen answer again clears it.
    _reports.update(
      r.id,
      injured: r.injured == value ? null : value,
      clearInjured: r.injured == value,
    );
  }

  void setTrapped(bool value) {
    final r = current;
    if (r == null) return;
    _reports.update(
      r.id,
      trapped: r.trapped == value ? null : value,
      clearTrapped: r.trapped == value,
    );
  }

  void changePeople(int delta) {
    final r = current;
    if (r == null) return;
    _reports.update(r.id, people: r.people + delta);
  }

  int takeFlushedCount() => _reports.takeFlushedCount();

  @override
  void dispose() {
    _reports.removeListener(notifyListeners);
    super.dispose();
  }
}
