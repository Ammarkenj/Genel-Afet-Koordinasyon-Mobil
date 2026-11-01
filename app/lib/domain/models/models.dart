/// Domain models used by the app and its backend integration.
library;

enum NetworkStatus { online, weak, offline }

enum IncidentType { quake, crash, fall, fire, other }

/// Why the 60 second safety countdown started.
enum CountdownCause { quake, crash, fall }

enum ReportKind { help, safe }

/// Delivery state for queued volunteer tasks.
enum DeliveryState { sent, queued, sending }

/// Delivery state for reports sent to the backend or kept local.
enum ReportDeliveryState { sent, queued, sending, failed, localOnly }

enum ReportDeliveryFailure { location, connection, server }

enum VolunteerRole { aid, rescue, logistics }

/// Needs shown to volunteers. Mirrors the Needs table of the ER diagram (need_type, description, urgency_level).
enum NeedId { aid, water, shelter }

class Report {
  Report({
    required this.id,
    required this.kind,
    required this.time,
    required this.state,
    required this.occurredAt,
    this.type,
    this.auto = false,
    this.clientReportId,
    this.serverReportId,
    this.latitude,
    this.longitude,
    this.canUndo = true,
    this.injured,
    this.trapped,
    this.people = 1,
  });

  final int id;
  final ReportKind kind;
  final IncidentType? type;
  final String time;
  final DateTime occurredAt;
  final bool auto;
  final String? clientReportId;
  String? serverReportId;
  double? latitude;
  double? longitude;
  bool canUndo;
  ReportDeliveryState state;
  ReportDeliveryFailure? deliveryFailure;

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
