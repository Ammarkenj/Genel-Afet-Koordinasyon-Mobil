const express = require("express");
const { createVolunteerController } = require("../controllers/volunteerController");
const { createAuthenticateUser } = require("../middleware/authenticateUser");
const { InMemoryVolunteerRepository } = require("../repositories/inMemoryVolunteerRepository");
const { VolunteerService } = require("../services/volunteerService");

function volunteerRoutes({ authRepository, volunteerRepository } = {}) {
  const router = express.Router();
  const service = new VolunteerService(
    volunteerRepository ?? new InMemoryVolunteerRepository(),
  );
  const controller = createVolunteerController(service);
  const requireUser = createAuthenticateUser(authRepository);

  router.use(requireUser);
  router.get("/me", controller.getDashboard);
  router.put("/me", controller.register);
  router.patch("/me/availability", controller.setAvailability);
  router.post("/me/assignments", controller.acceptNeed);
  router.patch(
    "/me/assignments/:assignmentId/complete",
    controller.completeAssignment,
  );

  return router;
}

module.exports = volunteerRoutes;
