UPDATE "User"
SET "phone_number" = '+90' || right(regexp_replace("phone_number", '[^0-9]', '', 'g'), 10)
WHERE regexp_replace("phone_number", '[^0-9]', '', 'g') ~ '^90[0-9]{10}$'
   OR regexp_replace("phone_number", '[^0-9]', '', 'g') ~ '^0?5[0-9]{9}$';

ALTER TABLE "User"
  ALTER COLUMN "full_name" DROP NOT NULL;

CREATE UNIQUE INDEX "User_phone_number_key" ON "User"("phone_number");

CREATE TABLE "AuthOtpChallenge" (
  "challenge_id" TEXT NOT NULL,
  "phone_number" TEXT NOT NULL,
  "code_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "consumed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthOtpChallenge_pkey" PRIMARY KEY ("challenge_id")
);

CREATE INDEX "AuthOtpChallenge_phone_number_created_at_idx"
  ON "AuthOtpChallenge"("phone_number", "created_at");

CREATE TABLE "AuthSession" (
  "session_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("session_id")
);

CREATE UNIQUE INDEX "AuthSession_token_hash_key" ON "AuthSession"("token_hash");
CREATE INDEX "AuthSession_user_id_expires_at_idx" ON "AuthSession"("user_id", "expires_at");

ALTER TABLE "AuthSession"
  ADD CONSTRAINT "AuthSession_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("user_id")
  ON DELETE CASCADE ON UPDATE CASCADE;
