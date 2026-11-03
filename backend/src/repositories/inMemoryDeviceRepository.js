class InMemoryDeviceRepository {
  constructor() {
    this.devices = new Map();
  }

  register(input) {
    const existing = this.devices.get(input.token);
    const now = new Date().toISOString();

    const device = {
      ...input,
      registeredAt: existing ? existing.registeredAt : now,
      updatedAt: now,
    };

    this.devices.set(input.token, device);
    return {
      device: { ...device },
      created: !existing,
    };
  }

  findByToken(token) {
    const device = this.devices.get(token);
    return device ? { ...device } : null;
  }

  remove(token) {
    return this.devices.delete(token);
  }

  listTokens({ cityCode } = {}) {
    const list = [];
    for (const device of this.devices.values()) {
      if (!cityCode || device.cityCode === cityCode) {
        list.push(device.token);
      }
    }
    return list;
  }

  count() {
    return this.devices.size;
  }
}

module.exports = { InMemoryDeviceRepository };
