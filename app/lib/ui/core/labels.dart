import '../../domain/models/models.dart';
import '../../l10n/app_localizations.dart';
import 'widgets/app_icon.dart';
import 'widgets/parts.dart';

/// Maps domain enums to localized words and to the icon that always sits beside them.
extension AppLabels on AppLocalizations {
  String incident(IncidentType t) => switch (t) {
    IncidentType.quake => typeQuake,
    IncidentType.crash => typeCrash,
    IncidentType.fall => typeFall,
    IncidentType.fire => typeFire,
    IncidentType.other => typeOther,
  };

  String cause(CountdownCause c) => switch (c) {
    CountdownCause.quake => cdQuake,
    CountdownCause.crash => cdCrash,
    CountdownCause.fall => cdFall,
  };

  String kind(ReportKind k) => k == ReportKind.help ? kindHelp : kindSafe;

  String delivery(DeliveryState s) => switch (s) {
    DeliveryState.sent => rstateSent,
    DeliveryState.queued => rstateQueued,
    DeliveryState.sending => rstateSending,
  };

  String network(NetworkStatus n) => switch (n) {
    NetworkStatus.online => netOnline,
    NetworkStatus.weak => netWeak,
    NetworkStatus.offline => netOffline,
  };

  String networkDesc(NetworkStatus n) => switch (n) {
    NetworkStatus.online => netOnlineDesc,
    NetworkStatus.weak => netWeakDesc,
    NetworkStatus.offline => netOfflineDesc,
  };

  String roleName(VolunteerRole r) => switch (r) {
    VolunteerRole.aid => volRoleAid,
    VolunteerRole.rescue => volRoleRescue,
    VolunteerRole.logistics => volRoleLogistics,
  };

  String roleDesc(VolunteerRole r) => switch (r) {
    VolunteerRole.aid => volRoleAidDesc,
    VolunteerRole.rescue => volRoleRescueDesc,
    VolunteerRole.logistics => volRoleLogisticsDesc,
  };

  String needName(NeedId n) => switch (n) {
    NeedId.aid => needAid,
    NeedId.water => needWater,
    NeedId.shelter => needShelter,
  };

  String needDesc(NeedId n) => switch (n) {
    NeedId.aid => needAidDesc,
    NeedId.water => needWaterDesc,
    NeedId.shelter => needShelterDesc,
  };

  String needDist(NeedId n) => switch (n) {
    NeedId.aid => needAidDist,
    NeedId.water => needWaterDist,
    NeedId.shelter => needShelterDist,
  };

  String urgency(int level) => switch (level) {
    1 => volUrg1,
    2 => volUrg2,
    _ => volUrg3,
  };

  String areaName(int number) => switch (number) {
    1 => area1,
    2 => area2,
    _ => area3,
  };
}

AppIconName incidentIcon(IncidentType t) => switch (t) {
  IncidentType.quake => AppIconName.quake,
  IncidentType.crash => AppIconName.car,
  IncidentType.fall => AppIconName.fall,
  IncidentType.fire => AppIconName.flame,
  IncidentType.other => AppIconName.alert,
};

AppIconName roleIcon(VolunteerRole r) => switch (r) {
  VolunteerRole.aid => AppIconName.firstAid,
  VolunteerRole.rescue => AppIconName.search,
  VolunteerRole.logistics => AppIconName.box,
};

AppIconName needIcon(NeedId n) => switch (n) {
  NeedId.aid => AppIconName.firstAid,
  NeedId.water => AppIconName.drop,
  NeedId.shelter => AppIconName.tent,
};

AppIconName networkIcon(NetworkStatus n) => switch (n) {
  NetworkStatus.online => AppIconName.wifi,
  NetworkStatus.weak => AppIconName.signalLow,
  NetworkStatus.offline => AppIconName.wifiOff,
};

Tone networkTone(NetworkStatus n) =>
    n == NetworkStatus.online ? Tone.ok : Tone.warn;

({Tone tone, AppIconName icon}) deliveryStyle(DeliveryState s) => switch (s) {
  DeliveryState.sent => (tone: Tone.ok, icon: AppIconName.checkCircle),
  DeliveryState.queued => (tone: Tone.warn, icon: AppIconName.clock),
  DeliveryState.sending => (tone: Tone.info, icon: AppIconName.sync),
};
