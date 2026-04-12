import { prisma } from "../../config/prisma";
import type { Prisma } from "../../generated/prisma/client";
import { BasicDiaryInput } from "./diaries.model";

type DiaryWithPhotos = Prisma.diaryGetPayload<{
  include: { diary_photo: true };
}>;

class DiariesRepository {
  constructor() {}

  async createBasicDiary(
    basicDiaryInput: BasicDiaryInput,
  ): Promise<DiaryWithPhotos> {
    const { userId, title, content, photos } = basicDiaryInput;
    return await prisma.diary.create({
      data: {
        user_id: userId,
        title,
        content: content || "",
        initial_draft: content || "",
        analysis: {},
        input_type: "MANUAL",
        ...(photos && photos.length > 0
          ? {
              diary_photo: {
                create: photos.map((url, index) => ({
                  image_url: url,
                  sort_order: index + 1,
                })),
              },
            }
          : {}),
      },
      include: {
        diary_photo: true,
      },
    });
  }

  async findDiaryById(
    userId: string,
    diaryId: string,
  ): Promise<DiaryWithPhotos | null> {
    return await prisma.diary.findFirst({
      where: {
        diary_id: diaryId,
        user_id: userId,
      },
      include: {
        diary_photo: {
          orderBy: {
            sort_order: "asc",
          },
        },
      },
    });
  }
}

export const diariesRepository = new DiariesRepository();
