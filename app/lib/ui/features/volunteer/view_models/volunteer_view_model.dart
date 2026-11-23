import 'package:flutter/foundation.dart';

import '../../../../data/repositories/volunteer_repository.dart';
import '../../../../domain/models/models.dart';

/// Volunteer flow: sign up, availability, open a need, accept it, complete it.
class VolunteerViewModel extends ChangeNotifier {
  VolunteerViewModel(this._repo) {
    _repo.addListener(_onRepositoryChanged);
    _role = _repo.role;
    _cert = _repo.hasCertificate;
  }

  final VolunteerRepository _repo;

  /// Sign-up form draft.
  late VolunteerRole _role;
  late bool _cert;
  NeedId _need = NeedId.water;
  String? _recordId;
  bool _busy = false;
  bool _loading = false;
  String? _errorCode;

  /// Where the flow was entered from (Home or Profile), so Back returns there.
  String origin = '/home';

  VolunteerRole get draftRole => _role;
  bool get draftCertificate => _cert;
  bool get joined => _repo.joined;
  VolunteerRole get role => _repo.role;
  bool get hasCertificate => _repo.hasCertificate;
  bool get available => _repo.available;
  List<VolunteerNeed> get needs => _repo.needs;
  VolunteerTask? get task => _repo.task;
  NeedId get need => _need;
  VolunteerNeed? get needDetail {
    for (final need in _repo.needs) {
      if (_recordId == null ? need.id == _need : need.recordId == _recordId) {
        return need;
      }
    }
    return null;
  }

  bool get busy => _busy;
  bool get loading => _loading;
  bool get hasLoaded => _repo.hasLoaded;
  bool get isDemo => _repo.isDemo;
  String? get errorCode => _errorCode;

  /// An accepted task that is not finished blocks accepting another one.
  bool get busyWithOther => task != null && !task!.done && !hasThisTask;
  bool get hasThisTask {
    final activeTask = task;
    if (activeTask == null) return false;
    if (activeTask.recordId != null && _recordId != null) {
      return activeTask.recordId == _recordId;
    }
    return activeTask.need == _need;
  }

  void setRole(VolunteerRole r) {
    _role = r;
    notifyListeners();
  }

  void toggleCertificate() {
    _cert = !_cert;
    notifyListeners();
  }

  Future<void> load() async {
    await _run<void>(() => _repo.refresh(), loading: true);
  }

  Future<bool> register() async =>
      await _run<bool>(() async {
        await _repo.register(role: _role, hasCertificate: _cert);
        return true;
      }) ??
      false;

  Future<bool> setAvailable(bool value) async =>
      await _run<bool>(() async {
        await _repo.setAvailable(value);
        return true;
      }) ??
      false;

  void openNeed(NeedId id, {String? recordId}) {
    _need = id;
    _recordId = recordId;
    notifyListeners();
  }

  Future<bool> accept() async {
    final selectedNeed = needDetail;
    if (selectedNeed == null) return false;
    return await _run<bool>(
          () => _repo.accept(_need, recordId: selectedNeed.recordId),
        ) ??
        false;
  }

  Future<void> complete() async {
    await _run<void>(() => _repo.complete());
  }

  int takeFlushedCount() => _repo.takeFlushedCount();

  void clearError() {
    _errorCode = null;
    notifyListeners();
  }

  Future<T?> _run<T>(
    Future<T> Function() action, {
    bool loading = false,
  }) async {
    if (_busy) return null;
    _busy = true;
    _loading = loading;
    _errorCode = null;
    notifyListeners();
    try {
      return await action();
    } on VolunteerApiException catch (error) {
      _errorCode = error.code;
      return null;
    } finally {
      _busy = false;
      _loading = false;
      notifyListeners();
    }
  }

  void _onRepositoryChanged() {
    _role = _repo.role;
    _cert = _repo.hasCertificate;
    notifyListeners();
  }

  @override
  void dispose() {
    _repo.removeListener(_onRepositoryChanged);
    super.dispose();
  }
}
