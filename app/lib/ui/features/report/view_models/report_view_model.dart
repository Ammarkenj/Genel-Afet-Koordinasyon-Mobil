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
  bool _creationFailed = false;

  List<Report> get recent => _reports.reports.reversed.take(3).toList();
  int get queuedCount => _reports.queuedCount;
  Report? get current => _currentId == null ? null : _reports.byId(_currentId!);
  bool get creationFailed => _creationFailed;

  Future<Report?> sendHelp(IncidentType type) => _make(ReportKind.help, type);

  Future<Report?> sendSafe() => _make(ReportKind.safe, null);

  Future<Report?> _make(ReportKind kind, IncidentType? type) async {
    _creationFailed = false;
    try {
      final report = await _reports.create(kind: kind, type: type);
      _currentId = report.id;
      notifyListeners();
      return report;
    } on Exception catch (error) {
      debugPrint('Report could not be saved locally (${error.runtimeType}).');
      _creationFailed = true;
      notifyListeners();
      return null;
    }
  }

  void open(int id) {
    _currentId = id;
    notifyListeners();
  }

  /// Takes back a report that was sent by mistake.
  Future<void> undo() async {
    final id = _currentId;
    if (id == null) return;
    await _reports.remove(id);
    _currentId = null;
    notifyListeners();
  }

  Future<void> retry() async {
    final id = _currentId;
    if (id == null) return;
    await _reports.retry(id);
  }

  Future<void> setInjured(bool value) async {
    final r = current;
    if (r == null) return;
    // Tapping the chosen answer again clears it.
    await _reports.update(
      r.id,
      injured: r.injured == value ? null : value,
      clearInjured: r.injured == value,
    );
  }

  Future<void> setTrapped(bool value) async {
    final r = current;
    if (r == null) return;
    await _reports.update(
      r.id,
      trapped: r.trapped == value ? null : value,
      clearTrapped: r.trapped == value,
    );
  }

  Future<void> changePeople(int delta) async {
    final r = current;
    if (r == null) return;
    await _reports.update(r.id, people: r.people + delta);
  }

  int takeFlushedCount() => _reports.takeFlushedCount();

  @override
  void dispose() {
    _reports.removeListener(notifyListeners);
    super.dispose();
  }
}
