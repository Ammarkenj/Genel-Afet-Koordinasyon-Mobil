CREATE UNIQUE INDEX "Volunteer_user_id_key" ON "Volunteer"("user_id");

ALTER TABLE "VolunteerAssignment"
  ALTER COLUMN "event_id" DROP NOT NULL,
  ADD COLUMN "need_id" TEXT,
  ADD COLUMN "completed_at" TIMESTAMP(3);

CREATE UNIQUE INDEX "VolunteerAssignment_need_id_key"
  ON "VolunteerAssignment"("need_id");

CREATE INDEX "VolunteerAssignment_volunteer_id_completed_at_idx"
  ON "VolunteerAssignment"("volunteer_id", "completed_at");

ALTER TABLE "VolunteerAssignment"
  ADD CONSTRAINT "VolunteerAssignment_need_id_fkey"
  FOREIGN KEY ("need_id") REFERENCES "Need"("need_id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
