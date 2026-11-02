const { randomUUID } = require("node:crypto");

class InMemoryAlertRepository {
  constructor() {
    this.alerts = new Map();
  }

  create(input) {
    const id = `alert-${randomUUID()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + input.expiresInHours * 3600 * 1000).toISOString();

    const alert = {
      id,
      type: input.type,
      severity: input.severity,
      title: input.title,
      message: input.message,
      location: input.location ? { ...input.location } : null,
      assemblyArea: input.assemblyArea ? { ...input.assemblyArea } : null,
      status: "active",
      sentAt: now.toISOString(),
      expiresAt,
    };

    this.alerts.set(id, alert);
    return { ...alert };
  }

  findById(id) {
    const alert = this.alerts.get(id);
    return alert ? { ...alert } : null;
  }

  listActive({ maxAgeHours = 48 } = {}) {
    const now = new Date().toISOString();
    const cutoff = new Date(Date.now() - maxAgeHours * 3600 * 1000).toISOString();

    const activeList = [];
    for (const alert of this.alerts.values()) {
      if (alert.status === "active" && alert.expiresAt > now && alert.sentAt >= cutoff) {
        activeList.push({ ...alert });
      }
    }

    // Sort newest first
    activeList.sort((a, b) => (b.sentAt > a.sentAt ? 1 : -1));
    return activeList;
  }

  resolve(id) {
    const alert = this.alerts.get(id);
    if (!alert) return null;

    alert.status = "resolved";
    alert.resolvedAt = new Date().toISOString();
    return { ...alert };
  }
}

module.exports = { InMemoryAlertRepository };
