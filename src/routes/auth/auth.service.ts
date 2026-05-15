import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";
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
import {
  KakaoCallbackRequestDto,
  KakaoCompleteSignupRequestDto,
  SignInRequestDto,
  SignUpRequestDto,
} from "./dto/auth.req.dto";
import { RegistrationType } from "./dto/auth.types";

type KakaoUserResponse = {
  id?: number;
  properties?: {
    nickname?: string;
    profile_image?: string;
  };
};

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

  async handleKakaoCallback(
    code: string,
  ): Promise<{
    needsSignup: boolean;
    accessToken?: string;
    refreshToken?: string;
    sessionToken?: string;
  }> {
    const normalizedCode = validateNonEmptyText(code, ErrorCode.INVALID023);

    await this.reserveKakaoAuthCode(normalizedCode);

    const accessToken = await this.exchangeKakaoCode(normalizedCode);
    const kakaoProfile = await this.fetchKakaoProfile(accessToken);

    if (!kakaoProfile.id) {
      throw new HttpException(ErrorCode.AUTH014);
    }

    const kakaoId = String(kakaoProfile.id);
    const existingOauthAccount = await usersRepository.findUserbyOauthId(
      kakaoId,
    );

    if (existingOauthAccount) {
      const tokenPair = await this.generateAndSaveTokens({
        sub: existingOauthAccount.user_id,
      });

      return {
        needsSignup: false,
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
      };
    }

    const sessionToken = randomUUID();
    await this.saveKakaoSignupSession(sessionToken, kakaoId);

    return {
      needsSignup: true,
      sessionToken,
    };
  }

  async completeKakaoSignup(
    requestBody: KakaoCompleteSignupRequestDto,
  ): Promise<AuthTokenPair> {
    const sessionToken = validateNonEmptyText(
      requestBody.sessionToken,
      ErrorCode.AUTH017,
    );
    const kakaoId = await this.consumeKakaoSignupSession(sessionToken);
    const name = validateNonEmptyText(requestBody.name, ErrorCode.AUTH001);
    const nickname = validateNonEmptyText(requestBody.nickname, ErrorCode.AUTH001);
    validateNickname(nickname);
    const birthDate = this.parseClientBirthDate(requestBody.birthDate);

    if (await usersRepository.findUserbyNickname(nickname)) {
      throw new HttpException(ErrorCode.AUTH002);
    }

    const newAccount = await authRepository.createAccount({
      email: null,
      hashedPassword: null,
      name,
      nickname,
      formattedBirthDate: birthDate,
      gender: requestBody.gender,
      registrationType: RegistrationType.KAKAO,
      oauthId: kakaoId,
      profileImage: requestBody.profileImage ?? null,
    });

    return await this.generateAndSaveTokens({ sub: newAccount.id });
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

  private async reserveKakaoAuthCode(code: string): Promise<void> {
    try {
      const key = REDIS_KEYS.KAKAO_AUTH_CODE(code);
      const result = await redisClient.set(key, "used", "EX", 300, "NX");

      if (result !== "OK") {
        throw new HttpException(ErrorCode.AUTH015);
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error(`[Kakao Auth Code] Redis 저장 실패 - code: ${code}`, error);
      throw new HttpException(ErrorCode.AUTH005, { code });
    }
  }

  private async saveKakaoSignupSession(
    sessionToken: string,
    kakaoId: string,
  ): Promise<void> {
    try {
      const result = await redisClient.set(
        REDIS_KEYS.KAKAO_SIGNUP_SESSION(sessionToken),
        kakaoId,
        "EX",
        300,
        "NX",
      );

      if (result !== "OK") {
        throw new HttpException(ErrorCode.AUTH015);
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error(
        `[Kakao Signup Session] Redis 저장 실패 - sessionToken: ${sessionToken}`,
        error,
      );
      throw new HttpException(ErrorCode.AUTH005, { sessionToken });
    }
  }

  private async consumeKakaoSignupSession(
    sessionToken: string,
  ): Promise<string> {
    const key = REDIS_KEYS.KAKAO_SIGNUP_SESSION(sessionToken);
    const kakaoId = await redisClient.get(key);

    if (!kakaoId) {
      throw new HttpException(ErrorCode.AUTH017);
    }

    await redisClient.del(key);
    return kakaoId;
  }

  private async exchangeKakaoCode(code: string): Promise<string> {
    const clientId = process.env.KAKAO_REST_API_KEY;
    const redirectUri = process.env.KAKAO_REDIRECT_URI;
    const clientSecret = process.env.KAKAO_CLIENT_SECRET;

    if (!clientId || !redirectUri) {
      throw new HttpException(ErrorCode.AUTH016);
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
    });

    if (clientSecret) {
      body.set("client_secret", clientSecret);
    }

    const response = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new HttpException(ErrorCode.AUTH013);
    }

    const payload = (await response.json()) as { access_token?: string };

    if (!payload.access_token) {
      throw new HttpException(ErrorCode.AUTH013);
    }

    return payload.access_token;
  }

  private async fetchKakaoProfile(
    accessToken: string,
  ): Promise<KakaoUserResponse> {
    const response = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new HttpException(ErrorCode.AUTH014);
    }

    return (await response.json()) as KakaoUserResponse;
  }

  private parseClientBirthDate(birthDate: string): Date {
    const normalizedBirthDate = validateNonEmptyText(
      birthDate,
      ErrorCode.AUTH001,
    );
    const birthDateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!birthDateRegex.test(normalizedBirthDate)) {
      throw new HttpException(ErrorCode.AUTH001, { birthDate });
    }

    const parsedBirthDate = new Date(`${normalizedBirthDate}T00:00:00.000Z`);

    if (Number.isNaN(parsedBirthDate.getTime())) {
      throw new HttpException(ErrorCode.AUTH001, { birthDate });
    }

    return parsedBirthDate;
  }
}

export const authService = new AuthService();
