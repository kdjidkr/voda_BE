import { randomUUID } from "crypto";

import { prisma } from "../../config/prisma";
import { RegistrationType } from "./dto/auth.types";
import { SignUpInput, SignUpOutput } from "./auth.model";

class AuthRepository {
  async createAccount(singUpInput: SignUpInput): Promise<SignUpOutput> {
    const {
      email,
      hashedPassword,
      name,
      nickname,
      formattedBirthDate,
      gender,
      registrationType,
      oauthId,
      profileImage,
    } = singUpInput;

    const result = await prisma.$transaction(async (tx) => {
      const userId = randomUUID();
      const user = await tx.user.create({
        data: {
          user_id: userId,
          email,
          password:
            registrationType === "EMAIL" ? (hashedPassword ?? null) : null,
          name,
          nickname,
          birth_date: formattedBirthDate,
          gender,
          profile_image: profileImage,
        },
      });

      if (registrationType !== "EMAIL") {
        await tx.user_oauth_account.create({
          data: {
            user_oauth_account_id: randomUUID(),
            user_id: user.user_id,
            registration_type: registrationType,
            oauth_id: oauthId!,
          },
        });
      }

      return user;
    });

    return {
      id: result.user_id,
      nickname: result.nickname,
    };
  }

  async createOauthAccount(
    userId: string,
    registrationType: RegistrationType,
    oauthId: string,
  ): Promise<void> {
    await prisma.user_oauth_account.create({
      data: {
        user_oauth_account_id: randomUUID(),
        user_id: userId,
        registration_type: registrationType,
        oauth_id: oauthId,
      },
    });
  }
}

export const authRepository = new AuthRepository();
