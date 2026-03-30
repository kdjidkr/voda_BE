import { prisma } from "../../config/prisma";

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
}

export const usersRepository = new UsersRepository();
