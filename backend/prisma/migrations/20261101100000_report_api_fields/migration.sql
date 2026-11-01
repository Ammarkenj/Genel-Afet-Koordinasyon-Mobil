ALTER TABLE "Report"
  ALTER COLUMN "user_id" DROP NOT NULL,
  ADD COLUMN "client_report_id" TEXT,
  ADD COLUMN "type" TEXT NOT NULL DEFAULT 'help',
  ADD COLUMN "occurred_at" TIMESTAMP(3),
  ADD COLUMN "description" TEXT,
  ADD COLUMN "updated_at" TIMESTAMP(3);

UPDATE "Report" SET "occurred_at" = "created_at";
UPDATE "Report" SET "updated_at" = "created_at";

ALTER TABLE "Report"
  ALTER COLUMN "occurred_at" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "occurred_at" SET NOT NULL,
  ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updated_at" SET NOT NULL;

CREATE UNIQUE INDEX "Report_client_report_id_key" ON "Report"("client_report_id");
