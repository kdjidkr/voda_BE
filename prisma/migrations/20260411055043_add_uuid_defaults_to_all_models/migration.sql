-- AlterTable
ALTER TABLE "call_room" ALTER COLUMN "call_room_id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "call_text" ALTER COLUMN "call_text_id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "chat_message" ALTER COLUMN "chat_message_id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "chat_room" ALTER COLUMN "chat_room_id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "diary_photo" ALTER COLUMN "diary_photo_id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "keyword" ALTER COLUMN "keyword_id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "voice_source" ALTER COLUMN "voice_id" SET DEFAULT gen_random_uuid();
