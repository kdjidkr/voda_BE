-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "diary_input_type" AS ENUM ('CALL', 'CHAT', 'VOICE', 'KEYWORDS', 'MANUAL', 'AI');

-- CreateEnum
CREATE TYPE "report_type" AS ENUM ('WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "user_gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "registration_type" AS ENUM ('EMAIL', 'KAKAO', 'GOOGLE', 'APPLE', 'NAVER');

-- CreateTable
CREATE TABLE "ai_memory" (
    "ai_memory_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "memory_data" JSONB,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_ai_memory" PRIMARY KEY ("ai_memory_id")
);

-- CreateTable
CREATE TABLE "call_room" (
    "call_room_id" UUID NOT NULL,

    CONSTRAINT "pk_call_room" PRIMARY KEY ("call_room_id")
);

-- CreateTable
CREATE TABLE "call_text" (
    "call_text_id" UUID NOT NULL,
    "call_room_id" UUID NOT NULL,
    "text_content" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_call_text" PRIMARY KEY ("call_text_id")
);

-- CreateTable
CREATE TABLE "chat_message" (
    "chat_message_id" UUID NOT NULL,
    "chat_room_id" UUID NOT NULL,
    "text_content" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_chat_message" PRIMARY KEY ("chat_message_id")
);

-- CreateTable
CREATE TABLE "chat_room" (
    "chat_room_id" UUID NOT NULL,

    CONSTRAINT "pk_chat_room" PRIMARY KEY ("chat_room_id")
);

-- CreateTable
CREATE TABLE "diary" (
    "diary_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200),
    "content" TEXT NOT NULL,
    "initial_draft" TEXT NOT NULL,
    "diary_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "analysis" JSONB NOT NULL,
    "input_type" "diary_input_type" NOT NULL,
    "input_id" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "pk_diary" PRIMARY KEY ("diary_id")
);

-- CreateTable
CREATE TABLE "diary_photo" (
    "diary_photo_id" UUID NOT NULL,
    "diary_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pk_diary_photo" PRIMARY KEY ("diary_photo_id")
);

-- CreateTable
CREATE TABLE "keyword" (
    "keyword_id" UUID NOT NULL,
    "diary_id" UUID NOT NULL,
    "keyword_text" TEXT NOT NULL,

    CONSTRAINT "pk_keyword" PRIMARY KEY ("keyword_id")
);

-- CreateTable
CREATE TABLE "report" (
    "report_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "report_type" "report_type" NOT NULL,
    "summary" JSONB NOT NULL,
    "base_date" DATE NOT NULL,
    "details_json" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_report" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "todo_list" (
    "todo_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT,
    "todo_type" VARCHAR(50) NOT NULL,
    "day_of_week" SMALLINT,
    "day_of_month" SMALLINT,
    "due_to" TIMESTAMP(6),
    "status" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_todo_list" PRIMARY KEY ("todo_id")
);

-- CreateTable
CREATE TABLE "user" (
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "birth_date" DATE NOT NULL,
    "nickname" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "registration_type" "registration_type" NOT NULL DEFAULT 'EMAIL',
    "gender" "user_gender" NOT NULL,
    "profile_image" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "pk_user" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_oauth_account" (
    "user_oauth_account_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "registration_type" "registration_type" NOT NULL,
    "oauth_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_user_oauth_account" PRIMARY KEY ("user_oauth_account_id")
);

-- CreateTable
CREATE TABLE "voice_source" (
    "voice_id" UUID NOT NULL,
    "voice_text" TEXT NOT NULL,

    CONSTRAINT "pk_voice_source" PRIMARY KEY ("voice_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_email" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_oauth_account_registration_type_oauth_id" ON "user_oauth_account"("registration_type", "oauth_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_oauth_account_user_id_registration_type" ON "user_oauth_account"("user_id", "registration_type");

-- AddForeignKey
ALTER TABLE "ai_memory" ADD CONSTRAINT "fk_user_to_ai_memory" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "call_text" ADD CONSTRAINT "fk_call_room_to_call_text" FOREIGN KEY ("call_room_id") REFERENCES "call_room"("call_room_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_message" ADD CONSTRAINT "fk_chat_room_to_chat_message" FOREIGN KEY ("chat_room_id") REFERENCES "chat_room"("chat_room_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "diary" ADD CONSTRAINT "fk_user_to_diary" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "fk_user_to_report" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "todo_list" ADD CONSTRAINT "fk_user_to_todo_list" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_oauth_account" ADD CONSTRAINT "fk_user_to_user_oauth_account" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
