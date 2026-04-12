import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { redisClient } from "../../config/redis";
import { REDIS_KEYS } from "../../config/redis";
import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";
import { JwtPayload } from "../../types/jwt-payload";
import { usersRepository } from "../users/users.repository";
import {
  validateEmail,
  validateNickname,
  validateNonEmptyText,
  validatePassword,
} from "../utils/validators";
import { AuthTokenPair, SignUpInput, SignUpOutput } from "./auth.model";
import { authRepository } from "./auth.repository";
import { SignInRequestDto, SignUpRequestDto } from "./dto/auth.req.dto";

class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor() {}

  async signUp(requestBody: SignUpRequestDto): Promise<AuthTokenPair> {
    await this.validateSignUpData(requestBody);
    return await this.processSignup(
      requestBody,
      async (hashedPassword, formattedBirthDate) => {
        const { password, birthDate, ...rest } = requestBody;
        const signUpInput: SignUpInput = {
          ...rest,
          hashedPassword,
          formattedBirthDate,
        };
        return await authRepository.createAccount(signUpInput);
      },
    );
  }

  async signIn(requestBody: SignInRequestDto): Promise<AuthTokenPair> {
    const email = requestBody.email.trim();
    validateEmail(email);
    const password = validateNonEmptyText(
      requestBody.password,
      ErrorCode.INVALID008,
    );

    const user = await usersRepository.findUserByEmailForSignIn(email);

    if (!user?.password) {
      throw new HttpException(ErrorCode.AUTH012);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new HttpException(ErrorCode.AUTH012);
    }

    return await this.generateAndSaveTokens({ sub: user.user_id });
  }

  async reissueTokens(
    userId: string,
    refreshToken: string,
  ): Promise<AuthTokenPair> {
    let savedRefreshToken: string | null;

    try {
      savedRefreshToken = await redisClient.get(
        REDIS_KEYS.REFRESH_TOKEN(userId),
      );
    } catch (error) {
      console.error(
        `[Refresh Token Read] Redis 조회 실패 - userId: ${userId}`,
        error,
      );
      throw new HttpException(ErrorCode.AUTH005, { userId });
    }

    if (!savedRefreshToken || savedRefreshToken !== refreshToken) {
      throw new HttpException(ErrorCode.AUTH010);
    }

    return await this.generateAndSaveTokens({ sub: userId });
  }

  private async processSignup(
    requestBody: SignUpRequestDto,
    createAccountFn: (
      hashedPassword: string | undefined,
      formattedBirthDate: Date,
    ) => Promise<SignUpOutput>,
  ): Promise<AuthTokenPair> {
    const { password, birthDate, registrationType } = requestBody;
    const formattedBirthDate = new Date(`${birthDate}T00:00:00.000Z`);
    const hashedPassword =
      password && registrationType === "EMAIL"
        ? await bcrypt.hash(password, this.SALT_ROUNDS)
        : undefined;

    const newAccount = await createAccountFn(
      hashedPassword,
      formattedBirthDate,
    );
    const payload: JwtPayload = {
      sub: newAccount.id,
    };
    return this.generateAndSaveTokens(payload);
  }

  private async validateSignUpData(singUpRawData: SignUpRequestDto) {
    const { email, nickname, password, registrationType, oauthId } =
      singUpRawData;
    validateEmail(email);
    validateNickname(nickname);
    if (password) {
      validatePassword(password);
    }

    if (registrationType === "EMAIL" && oauthId) {
      throw new HttpException(ErrorCode.AUTH001, { registrationType, oauthId });
    }
    if (registrationType !== "EMAIL" && password) {
      throw new HttpException(ErrorCode.AUTH001, { registrationType });
    }
    if (registrationType === "EMAIL" && !password) {
      throw new HttpException(ErrorCode.AUTH001, { registrationType });
    }
    if (registrationType !== "EMAIL" && !oauthId) {
      throw new HttpException(ErrorCode.AUTH001, { registrationType });
    }

    if (password) {
      validatePassword(password);
    }

    if (await usersRepository.findUserbyNickname(nickname)) {
      throw new HttpException(ErrorCode.AUTH002);
    }

    if (await usersRepository.findUserbyEmail(email)) {
      throw new HttpException(ErrorCode.AUTH003);
    }

    if (oauthId && (await usersRepository.findUserbyOauthId(oauthId))) {
      throw new HttpException(ErrorCode.AUTH004);
    }
  }

  private async generateAndSaveTokens(
    payload: JwtPayload,
  ): Promise<AuthTokenPair> {
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "14d",
    });
    try {
      await redisClient.set(
        REDIS_KEYS.REFRESH_TOKEN(payload.sub),
        refreshToken,
        "EX",
        60 * 60 * 24 * 14,
      );
    } catch (error) {
      console.error(
        `[Refresh Token Storage] Redis 저장 실패 - userId: ${payload}`,
        error,
      );
      throw new HttpException(ErrorCode.AUTH005, { payload });
    }
    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
