import 'package:flutter/foundation.dart';

import '../../../../data/repositories/volunteer_repository.dart';
import '../../../../domain/models/models.dart';

/// Volunteer flow: sign up, availability, open a need, accept it, complete it.
class VolunteerViewModel extends ChangeNotifier {
  VolunteerViewModel(this._repo) {
    _repo.addListener(notifyListeners);
    _role = _repo.role;
    _cert = _repo.hasCertificate;
  }

  final VolunteerRepository _repo;

  /// Sign-up form draft.
  late VolunteerRole _role;
  late bool _cert;
  NeedId _need = NeedId.water;

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
  VolunteerNeed get needDetail => _repo.needs.firstWhere((n) => n.id == _need);

  /// An accepted task that is not finished blocks accepting another one.
  bool get busyWithOther => task != null && !task!.done && task!.need != _need;
  bool get hasThisTask => task != null && task!.need == _need;

  void setRole(VolunteerRole r) {
    _role = r;
    notifyListeners();
  }

  void toggleCertificate() {
    _cert = !_cert;
    notifyListeners();
  }

  void register() => _repo.register(role: _role, hasCertificate: _cert);

  void setAvailable(bool v) => _repo.setAvailable(v);

  void openNeed(NeedId id) {
    _need = id;
    notifyListeners();
  }

  bool accept() => _repo.accept(_need);

  void complete() => _repo.complete();

  int takeFlushedCount() => _repo.takeFlushedCount();

  @override
  void dispose() {
    _repo.removeListener(notifyListeners);
    super.dispose();
  }
}
