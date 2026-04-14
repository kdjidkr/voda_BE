import { prisma } from "../../config/prisma";
import { UserMeBaseProfile } from "./users.model";

class UsersRepository {
  async findUserbyNickname(nickname: string) {
    return prisma.user.findFirst({
      where: {
        nickname,
        deleted_at: null,
      },
      select: {
        user_id: true,
      },
    });
  }

  async findUserbyEmail(email: string) {
    return prisma.user.findFirst({
      where: {
        email,
        deleted_at: null,
      },
      select: {
        user_id: true,
      },
    });
  }

  async findUserByEmailForSignIn(email: string) {
    return prisma.user.findFirst({
      where: {
        email,
        deleted_at: null,
      },
      select: {
        user_id: true,
        password: true,
      },
    });
  }

  async findUserbyOauthId(oauthId: string) {
    return prisma.user_oauth_account.findFirst({
      where: {
        oauth_id: oauthId,
      },
      select: {
        user_oauth_account_id: true,
      },
    });
  }

  async findUserMeBaseProfile(userId: string): Promise<UserMeBaseProfile | null> {
    return prisma.user.findFirst({
      where: {
        user_id: userId,
        deleted_at: null,
      },
      select: {
        user_id: true,
        nickname: true,
        email: true,
        profile_image: true,
        gender: true,
        birth_date: true,
        oauth_accounts: {
          select: {
            registration_type: true,
          },
        },
      },
    });
  }

  async countUserDiaries(userId: string): Promise<number> {
    return prisma.diary.count({
      where: {
        user_id: userId,
        deleted_at: null,
      },
    });
  }

  async findUserDiaryDates(userId: string): Promise<Date[]> {
    const diaryDates = await prisma.diary.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
      },
      select: {
        diary_date: true,
      },
      orderBy: {
        diary_date: "desc",
      },
      distinct: ["diary_date"],
    });

    return diaryDates.map((diary) => diary.diary_date);
  }
}

export const usersRepository = new UsersRepository();
