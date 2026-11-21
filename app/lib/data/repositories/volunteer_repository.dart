import 'package:flutter/foundation.dart';
import 'connectivity_repository.dart';
import '../../domain/models/models.dart';

abstract class VolunteerRepository extends ChangeNotifier {
  int takeFlushedCount();
  
  // المتغيرات التي يطلبها نظام المتطوعين
  VolunteerRole get role;
  bool get hasCertificate;
  bool get joined;
  bool get available;
  List<VolunteerNeed> get needs;
  VolunteerTask? get task;

  // دوال العمليات
  void register({required VolunteerRole role, required bool hasCertificate});
  void setAvailable(bool v);
  bool accept(dynamic needId);
  void complete();
}

class FakeVolunteerRepository extends VolunteerRepository {
  final FakeConnectivityRepository connectivity;

  FakeVolunteerRepository(this.connectivity);

  @override
  int takeFlushedCount() => 0;

  // قيم افتراضية لكي تفتح الواجهة بدون أخطاء
  @override
  VolunteerRole get role => VolunteerRole.rescue; 

  @override
  bool get hasCertificate => false;

  @override
  bool get joined => false;

  @override
  bool get available => false;

  @override
  List<VolunteerNeed> get needs => [];

  @override
  VolunteerTask? get task => null;

  @override
  void register({required VolunteerRole role, required bool hasCertificate}) {}

  @override
  void setAvailable(bool v) {}

  @override
  bool accept(dynamic needId) => false;

  @override
  void complete() {}
}