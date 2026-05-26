/*
  Warnings:

  - You are about to drop the column `day_of_month` on the `todo_list` table. All the data in the column will be lost.
  - You are about to drop the column `day_of_week` on the `todo_list` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `todo_list` table. All the data in the column will be lost.
  - You are about to drop the column `todo_type` on the `todo_list` table. All the data in the column will be lost.
  - You are about to alter the column `content` on the `todo_list` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - Made the column `content` on table `todo_list` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "routine_type" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- DropForeignKey
ALTER TABLE "todo_list" DROP CONSTRAINT "fk_user_to_todo_list";

-- AlterTable
ALTER TABLE "todo_list" RENAME CONSTRAINT "pk_todo_list" TO "todo_list_pkey";

ALTER TABLE "todo_list"
DROP COLUMN "day_of_month",
DROP COLUMN "day_of_week",
DROP COLUMN "title",
DROP COLUMN "todo_type",
ALTER COLUMN "content" SET NOT NULL,
ALTER COLUMN "content" SET DATA TYPE VARCHAR(255);

-- CreateTable
CREATE TABLE "routine" (
    "routine_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "content" VARCHAR(255) NOT NULL,
    "type" "routine_type" NOT NULL,
    "days_of_week" INTEGER[],
    "day_of_month" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routine_pkey" PRIMARY KEY ("routine_id")
);

-- CreateTable
CREATE TABLE "routine_history" (
    "history_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "routine_id" UUID NOT NULL,
    "completed_at" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routine_history_pkey" PRIMARY KEY ("history_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "routine_history_routine_id_completed_at_key" ON "routine_history"("routine_id", "completed_at");

-- AddForeignKey
ALTER TABLE "todo_list" ADD CONSTRAINT "todo_list_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine" ADD CONSTRAINT "routine_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_history" ADD CONSTRAINT "routine_history_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routine"("routine_id") ON DELETE CASCADE ON UPDATE CASCADE;
