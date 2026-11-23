function createVolunteerController(service) {
  return {
    async getDashboard(req, res) {
      const data = await service.getDashboard(req.authenticatedUser.id);
      return res.json({ data });
    },

    async register(req, res) {
      const data = await service.register(req.authenticatedUser.id, req.body);
      return res.status(200).json({ data });
    },

    async setAvailability(req, res) {
      const data = await service.setAvailability(
        req.authenticatedUser.id,
        req.body,
      );
      return res.json({ data });
    },

    async acceptNeed(req, res) {
      const data = await service.acceptNeed(
        req.authenticatedUser.id,
        req.body,
      );
      return res.status(201).json({ data });
    },

    async completeAssignment(req, res) {
      const data = await service.completeAssignment(
        req.authenticatedUser.id,
        req.params.assignmentId,
      );
      return res.json({ data });
    },
  };
}

module.exports = { createVolunteerController };
