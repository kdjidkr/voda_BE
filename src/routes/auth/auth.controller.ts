import {
  Body,
  Controller,
  Example,
  Post,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";

import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";
import { ApiResponse } from "../../interfaces/ApiResponse";
import { authService } from "./auth.service";
import { SignInRequestDto, SignUpRequestDto } from "./dto/auth.req.dto";
import { AccessTokenResponseDto } from "./dto/auth.res.dto";

@Route("auth")
@Tags("로그인, 회원가입 등 인증 기능을 담당합니다.")
export class AuthController extends Controller {
  /**
   * @summary 이메일으로 회원가입합니다.
   * @description 이메일 회원가입: 가입 정보를 받아 회원가입 처리 후 access Token 발급, refresh Token 쿠키 설정
   * @returns accessToken 발급 (refreshToken은 쿠키로 설정)
   */
  @SuccessResponse(201, "일반 회원가입 성공")
  @Example<ApiResponse<AccessTokenResponseDto>>({
    success: true,
    data: {
      accessToken: "accessToken",
    },
  })
  @Response<ApiResponse<null>>(400, "회원가입 유효성 검증 오류", {
    success: false,
    error: {
      code: "INVALID001",
      message: "닉네임 형식이 올바르지 않습니다.",
      details: {
        nickname: "닉네임!",
      },
    },
  })
  @Response<ApiResponse<null>>(400, "회원가입 유효성 검증 오류", {
    success: false,
    error: {
      code: "INVALID002",
      message: "이메일 형식이 올바르지 않습니다.",
      details: {
        email: "kcwidrk@naver",
      },
    },
  })
  @Response<ApiResponse<null>>(400, "회원가입 유효성 검증 오류", {
    success: false,
    error: {
      code: "INVALID003",
      message: "비밀번호 형식이 올바르지 않습니다.",
      details: undefined,
    },
  })
  @Response<ApiResponse<null>>(409, "중복된 회원 정보", {
    success: false,
    error: {
      code: "AUTH002",
      message: "이미 존재하는 닉네임입니다.",
      details: {
        nickname: "닉네임",
      },
    },
  })
  @Response<ApiResponse<null>>(409, "중복된 회원 정보", {
    success: false,
    error: {
      code: "AUTH003",
      message: "이미 존재하는 이메일입니다.",
      details: {
        email: "kcwidrk@naver.com",
      },
    },
  })
  @Response<ApiResponse<null>>(409, "중복된 회원 정보", {
    success: false,
    error: {
      code: "AUTH004",
      message: "이미 가입된 소셜 계정입니다.",
      details: {
        oauthId: "string",
      },
    },
  })
  @Post("signup")
  public async signUp(
    @Body() requestBody: SignUpRequestDto,
  ): Promise<ApiResponse<AccessTokenResponseDto>> {
    const result = await authService.signUp(requestBody);
    const { accessToken, refreshToken } = result;
    this.setStatus(201);
    const cookieOption = this.getCookieOptions(1209600);
    const cookieName = this.getRefreshCookieName();
    this.setHeader(
      "Set-Cookie",
      `${cookieName}=${refreshToken}; ${cookieOption}`,
    );
    this.setStatus(201);

    return {
      success: true,
      data: {
        accessToken,
      },
    };
  }

  /**
   * @summary 이메일로 로그인합니다.
   * @description 이메일과 비밀번호를 받아 인증 후 access Token 발급, refresh Token 쿠키 설정
   * @returns accessToken 발급 (refreshToken은 쿠키로 설정)
   */
  @SuccessResponse(200, "일반 로그인 성공")
  @Example<ApiResponse<AccessTokenResponseDto>>({
    success: true,
    data: {
      accessToken: "accessToken",
    },
  })
  @Response<ApiResponse<null>>(400, "로그인 유효성 검증 오류", {
    success: false,
    error: {
      code: "INVALID002",
      message: "이메일 형식이 올바르지 않습니다.",
      details: {
        email: "kcwidrk@naver",
      },
    },
  })
  @Response<ApiResponse<null>>(400, "로그인 유효성 검증 오류", {
    success: false,
    error: {
      code: "INVALID008",
      message: "비밀번호는 공백일 수 없습니다.",
      details: {
        password: "",
      },
    },
  })
  @Response<ApiResponse<null>>(401, "로그인 인증 실패", {
    success: false,
    error: {
      code: "AUTH012",
      message: "이메일 또는 비밀번호가 올바르지 않습니다.",
    },
  })
  @Post("login")
  public async signIn(
    @Body() requestBody: SignInRequestDto,
  ): Promise<ApiResponse<AccessTokenResponseDto>> {
    const result = await authService.signIn(requestBody);
    const { accessToken, refreshToken } = result;
    this.setStatus(200);
    const cookieOption = this.getCookieOptions(1209600);
    const cookieName = this.getRefreshCookieName();
    this.setHeader(
      "Set-Cookie",
      `${cookieName}=${refreshToken}; ${cookieOption}`,
    );

    return {
      success: true,
      data: {
        accessToken,
      },
    };
  }

  /**
   * @summary 리프레시 토큰으로 토큰을 재발급합니다.
   * @description 쿠키의 refresh token과 Redis 저장 토큰을 검증한 뒤 access/refresh token을 재발급합니다.
   * @returns accessToken 발급 (refreshToken은 쿠키로 재설정)
   */
  @Security("jwtRefresh")
  @SuccessResponse(200, "토큰 재발급 성공")
  @Example<ApiResponse<AccessTokenResponseDto>>({
    success: true,
    data: {
      accessToken: "accessToken",
    },
  })
  @Response<ApiResponse<null>>(401, "리프레시 토큰이 없는 경우", {
    success: false,
    error: {
      code: "AUTH009",
      message: "리프레시 토큰이 없습니다.",
    },
  })
  @Response<ApiResponse<null>>(401, "리프레시 토큰이 유효하지 않은 경우", {
    success: false,
    error: {
      code: "AUTH010",
      message: "리프레시 토큰이 유효하지 않습니다.",
    },
  })
  @Post("refresh")
  public async refreshToken(
    @Request() req: any,
  ): Promise<ApiResponse<AccessTokenResponseDto>> {
    const userId = req.user?.sub;
    const refreshToken =
      req.cookies?.["__Host-refresh_token"] ?? req.cookies?.["refresh_token"];

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH010);
    }

    if (!refreshToken) {
      throw new HttpException(ErrorCode.AUTH009);
    }

    const result = await authService.reissueTokens(userId, refreshToken);
    const { accessToken, refreshToken: rotatedRefreshToken } = result;
    this.setStatus(200);
    const cookieOption = this.getCookieOptions(1209600);
    const cookieName = this.getRefreshCookieName();
    this.setHeader(
      "Set-Cookie",
      `${cookieName}=${rotatedRefreshToken}; ${cookieOption}`,
    );

    return {
      success: true,
      data: {
        accessToken,
      },
    };
  }

  private getCookieOptions(maxAge: number): string {
    const isDevelopment = process.env.COOKIE_SETUP === "development";
    const sameSite = isDevelopment ? "Lax" : "None";
    const secure = isDevelopment ? "" : "Secure;";
    return `HttpOnly; ${secure} Max-Age=${maxAge}; Path=/; SameSite=${sameSite}`;
  }

  private getRefreshCookieName(): string {
    const isDevelopment = process.env.COOKIE_SETUP === "development";
    return isDevelopment ? "refresh_token" : "__Host-refresh_token";
  }
}
