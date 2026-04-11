import { prisma } from "../../config/prisma";
import { BasicDiaryInput } from "./diaries.model";
import type { Prisma } from "../../generated/prisma/client";

type DiaryWithPhotos = Prisma.diaryGetPayload<{
    include: { diary_photo: true };
}>;


class DiariesRepository {
    constructor() {}

    async createBasicDiary( 
        basicDiaryInput: BasicDiaryInput,
    ): Promise<DiaryWithPhotos> {
        const { userId, title, content, photos } = basicDiaryInput;
        if (!(content)) {
            throw new Error("내용이 없다는 오류 생성");
        }
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
}

export const diariesRepository = new DiariesRepository();