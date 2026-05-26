-- AlterTable
CREATE SEQUENCE diary_photo_sort_order_seq;
ALTER TABLE "diary_photo" ALTER COLUMN "sort_order" SET DEFAULT nextval('diary_photo_sort_order_seq');
ALTER SEQUENCE diary_photo_sort_order_seq OWNED BY "diary_photo"."sort_order";

-- AddForeignKey
ALTER TABLE "diary_photo" ADD CONSTRAINT "diary_photo_diary_id_fkey" FOREIGN KEY ("diary_id") REFERENCES "diary"("diary_id") ON DELETE CASCADE ON UPDATE NO ACTION;
