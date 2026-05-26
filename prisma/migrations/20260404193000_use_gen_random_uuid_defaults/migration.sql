CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE "ai_memory"
  ALTER COLUMN "ai_memory_id" SET DEFAULT gen_random_uuid();

ALTER TABLE "diary"
  ALTER COLUMN "diary_id" SET DEFAULT gen_random_uuid();

ALTER TABLE "report"
  ALTER COLUMN "report_id" SET DEFAULT gen_random_uuid();

ALTER TABLE "todo_list"
  ALTER COLUMN "todo_id" SET DEFAULT gen_random_uuid();

ALTER TABLE "user"
  ALTER COLUMN "user_id" SET DEFAULT gen_random_uuid();

ALTER TABLE "user_oauth_account"
  ALTER COLUMN "user_oauth_account_id" SET DEFAULT gen_random_uuid();
