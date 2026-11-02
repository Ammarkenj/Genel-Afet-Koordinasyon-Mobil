const { validateDeviceRegistration } = require("../validation/deviceValidation");

function createDevicesController(deviceRepository) {
  return {
    async registerDevice(req, res) {
      const input = validateDeviceRegistration(req.body);
      const result = await deviceRepository.register(input);

      return res.status(result.created ? 201 : 200).json({
        data: result.device,
        created: result.created,
      });
    },

    async unregisterDevice(req, res) {
      const { token } = req.params;
      const removed = await deviceRepository.remove(token);

      return res.json({
        success: removed,
        message: removed ? "Device unregistered successfully." : "Device token not found.",
      });
    },

    async getDeviceStats(req, res) {
      const count = await deviceRepository.count();
      return res.json({
        data: {
          totalRegisteredDevices: count,
        },
      });
    },
  };
}

module.exports = { createDevicesController };
