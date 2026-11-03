enum AlertSeverity { critical, warning, info }

class EmergencyAlert {
  const EmergencyAlert({
    required this.id,
    required this.type,
    required this.severity,
    required this.title,
    required this.message,
    required this.sentAt,
    this.cityName,
    this.latitude,
    this.longitude,
    this.radiusKm,
    this.assemblyAreaName,
    this.assemblyLat,
    this.assemblyLng,
    this.status = 'active',
  });

  final String id;
  final String type;
  final AlertSeverity severity;
  final String title;
  final String message;
  final DateTime sentAt;
  final String? cityName;
  final double? latitude;
  final double? longitude;
  final double? radiusKm;
  final String? assemblyAreaName;
  final double? assemblyLat;
  final double? assemblyLng;
  final String status;

  bool get isActive => status == 'active';
  bool get isCritical => severity == AlertSeverity.critical;

  factory EmergencyAlert.fromJson(Map<String, dynamic> json) {
    final location = json['location'] as Map<String, dynamic>?;
    final assembly = json['assemblyArea'] as Map<String, dynamic>?;

    final severityStr = (json['severity'] as String?)?.toLowerCase();
    final severity = switch (severityStr) {
      'critical' => AlertSeverity.critical,
      'warning' => AlertSeverity.warning,
      _ => AlertSeverity.info,
    };

    return EmergencyAlert(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? 'general',
      severity: severity,
      title: json['title'] as String? ?? '',
      message: json['message'] as String? ?? '',
      sentAt: DateTime.tryParse(json['sentAt'] as String? ?? '')?.toUtc() ??
          DateTime.now().toUtc(),
      cityName: location?['cityName'] as String?,
      latitude: (location?['latitude'] as num?)?.toDouble(),
      longitude: (location?['longitude'] as num?)?.toDouble(),
      radiusKm: (location?['radiusKm'] as num?)?.toDouble(),
      assemblyAreaName: assembly?['name'] as String?,
      assemblyLat: (assembly?['latitude'] as num?)?.toDouble(),
      assemblyLng: (assembly?['longitude'] as num?)?.toDouble(),
      status: json['status'] as String? ?? 'active',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'type': type,
    'severity': severity.name,
    'title': title,
    'message': message,
    'sentAt': sentAt.toIso8601String(),
    'location': {
      'cityName': cityName,
      'latitude': latitude,
      'longitude': longitude,
      'radiusKm': radiusKm,
    },
    'assemblyArea': {
      'name': assemblyAreaName,
      'latitude': assemblyLat,
      'longitude': assemblyLng,
    },
    'status': status,
  };
}
