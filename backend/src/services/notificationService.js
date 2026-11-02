class NotificationService {
  constructor({ deviceRepository, provider } = {}) {
    this.deviceRepository = deviceRepository;
    this.provider = provider || new MockNotificationProvider();
  }

  async dispatchAlert(alert) {
    const tokens = this.deviceRepository
      ? this.deviceRepository.listTokens({
          cityCode: alert.location?.cityName || null,
        })
      : [];

    const payload = {
      notification: {
        title: `🚨 ${alert.title}`,
        body: alert.message,
      },
      data: {
        alertId: alert.id,
        type: alert.type,
        severity: alert.severity,
        latitude: alert.location?.latitude?.toString() || "",
        longitude: alert.location?.longitude?.toString() || "",
        assemblyAreaName: alert.assemblyArea?.name || "",
        assemblyLat: alert.assemblyArea?.latitude?.toString() || "",
        assemblyLng: alert.assemblyArea?.longitude?.toString() || "",
        sentAt: alert.sentAt,
      },
      android: {
        priority: "high",
        notification: {
          channelId: "emergency_alerts",
          sound: "emergency_alarm",
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
    };

    const result = await this.provider.sendToDevices(tokens, payload);
    return {
      dispatchedCount: tokens.length,
      ...result,
    };
  }
}

class MockNotificationProvider {
  constructor() {
    this.sentNotifications = [];
  }

  async sendToDevices(tokens, payload) {
    const record = {
      tokens: [...tokens],
      payload,
      sentAt: new Date().toISOString(),
    };
    this.sentNotifications.push(record);
    return {
      success: true,
      deliveredTokensCount: tokens.length,
    };
  }

  getHistory() {
    return [...this.sentNotifications];
  }

  clear() {
    this.sentNotifications = [];
  }
}

module.exports = {
  NotificationService,
  MockNotificationProvider,
};
