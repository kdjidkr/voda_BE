import { randomUUID } from "crypto";

import { prisma } from "../../config/prisma";
import { SignUpInput, SignUpOutput } from "./dto/auth.model";

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
    } = singUpInput;

    const result = await prisma.$transaction(async (tx) => {
      const userId = randomUUID();
      const user = await tx.user.create({
        data: {
          user_id: userId,
          email,
          password: registrationType === "EMAIL" ? (hashedPassword ?? "") : "",
          name,
          nickname,
          birth_date: formattedBirthDate,
          gender,
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
}

export const authRepository = new AuthRepository();
