import { prisma } from "../../config/prisma";
import type { Prisma } from "../../generated/prisma/client";
import { BasicDiaryInput, UpdateBasicDiaryInput } from "./diaries.model";

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

  async updateBasicDiary(
    userId: string,
    diaryId: string,
    updateBasicDiaryInput: UpdateBasicDiaryInput,
  ): Promise<DiaryWithPhotos | null> {
    const result = await prisma.diary.updateMany({
      where: {
        diary_id: diaryId,
        user_id: userId,
      },
      data: updateBasicDiaryInput,
    });

    if (result.count === 0) {
      return null;
    }

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

  async deleteDiaryPhoto(
    userId: string,
    diaryPhotoId: string,
  ): Promise<boolean> {
    const result = await prisma.diary_photo.deleteMany({
      where: {
        diary_photo_id: diaryPhotoId,
        diary: {
          user_id: userId,
        },
      },
    });

    return result.count > 0;
  }
}

export const diariesRepository = new DiariesRepository();
