/// Domain models. Sample data only: there is no backend in this phase.
library;

enum NetworkStatus { online, weak, offline }

enum IncidentType { quake, crash, fall, fire, other }

/// Why the 60 second safety countdown started.
enum CountdownCause { quake, crash, fall }

enum ReportKind { help, safe }

/// Delivery of a report or an accepted task. `queued` is the offline case: saved on the device, sent later.
enum DeliveryState { sent, queued, sending }

enum VolunteerRole { aid, rescue, logistics }

/// Needs shown to volunteers. Mirrors the Needs table of the ER diagram (need_type, description, urgency_level).
enum NeedId { aid, water, shelter }

class Report {
  Report({
    required this.id,
    required this.kind,
    required this.time,
    required this.state,
    this.type,
    this.auto = false,
    this.injured,
    this.trapped,
    this.people = 1,
  });

  final int id;
  final ReportKind kind;
  final IncidentType? type;
  final String time;
  final bool auto;
  DeliveryState state;

  /// Optional details, filled in after the report is already sent (null = not answered).
  bool? injured;
  bool? trapped;
  int people;
}

class VolunteerNeed {
  const VolunteerNeed({
    required this.id,
    required this.urgency,
    required this.meters,
  });

  final NeedId id;

  /// 1 = normal, 2 = urgent, 3 = very urgent. Always shown with words and dots, never colour alone.
  final int urgency;
  final int meters;
}

class VolunteerTask {
  VolunteerTask({
    required this.need,
    required this.time,
    required this.state,
    this.done = false,
  });

  final NeedId need;
  final String time;
  DeliveryState state;
  bool done;
}

class AssemblyArea {
  const AssemblyArea({
    required this.number,
    required this.meters,
    required this.minutes,
  });

  final int number;
  final int meters;
  final int minutes;
}
