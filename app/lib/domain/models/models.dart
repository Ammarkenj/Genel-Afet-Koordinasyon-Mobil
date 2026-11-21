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
    this.clientUpdateToken,
    this.serverReportId,
    this.detailsRevision = 0,
    this.syncedDetailsRevision = 0,
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
  String? clientUpdateToken;
  String? serverReportId;
  int detailsRevision;
  int syncedDetailsRevision;
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

class Shelter {
  const Shelter({
    required this.id,
    required this.name,
    required this.category,
    required this.latitude,
    required this.longitude,
    this.capacity,
    this.features,
  });

  final String id;
  final String name;
  final String category;
  final int? capacity;
  final double latitude;
  final double longitude;
  final String? features;

  factory Shelter.fromApiJson(Map<String, dynamic> json) => Shelter(
    id: _catalogString(json['id'], 'id'),
    name: _catalogString(json['name'], 'name'),
    category: _catalogString(json['category'], 'category'),
    capacity: _catalogInt(json['capacity'], 'capacity'),
    latitude: _catalogDouble(json['latitude'], 'latitude'),
    longitude: _catalogDouble(json['longitude'], 'longitude'),
    features: _catalogOptionalString(json['features'], 'features'),
  );

  factory Shelter.fromDatabase(Map<String, Object?> row) => Shelter(
    id: _catalogString(row['id'], 'id'),
    name: _catalogString(row['name'], 'name'),
    category: _catalogString(row['category'], 'category'),
    capacity: _catalogInt(row['capacity'], 'capacity'),
    latitude: _catalogDouble(row['latitude'], 'latitude'),
    longitude: _catalogDouble(row['longitude'], 'longitude'),
    features: _catalogOptionalString(row['features'], 'features'),
  );

  Map<String, Object?> toDatabase() => {
    'id': id,
    'name': name,
    'category': category,
    'capacity': capacity,
    'latitude': latitude,
    'longitude': longitude,
    'features': features,
  };
}

class EmergencyGuide {
  const EmergencyGuide({
    required this.id,
    required this.title,
    required this.category,
    required this.content,
  });

  final String id;
  final String title;
  final String category;
  final String content;

  factory EmergencyGuide.fromApiJson(Map<String, dynamic> json) =>
      EmergencyGuide(
        id: _catalogString(json['id'], 'id'),
        title: _catalogString(json['title'], 'title'),
        category: _catalogString(json['category'], 'category'),
        content: _catalogString(json['content'], 'content'),
      );

  factory EmergencyGuide.fromDatabase(Map<String, Object?> row) =>
      EmergencyGuide(
        id: _catalogString(row['id'], 'id'),
        title: _catalogString(row['title'], 'title'),
        category: _catalogString(row['category'], 'category'),
        content: _catalogString(row['content'], 'content'),
      );

  Map<String, Object?> toDatabase() => {
    'id': id,
    'title': title,
    'category': category,
    'content': content,
  };
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

String _catalogString(Object? value, String field) {
  if (value is String) return value;
  throw FormatException('Catalog field "$field" must be a string.');
}

String? _catalogOptionalString(Object? value, String field) {
  if (value == null || value is String) return value as String?;
  throw FormatException('Catalog field "$field" must be a string or null.');
}

int? _catalogInt(Object? value, String field) {
  if (value == null) return null;
  if (value is int) return value;
  throw FormatException('Catalog field "$field" must be an integer or null.');
}

double _catalogDouble(Object? value, String field) {
  if (value is num) return value.toDouble();
  throw FormatException('Catalog field "$field" must be numeric.');
}
