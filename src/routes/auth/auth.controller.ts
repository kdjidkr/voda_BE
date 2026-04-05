import {
  Body,
  Controller,
  Example,
  Post,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from "tsoa";

import { ApiResponse } from "../../interfaces/ApiResponse";
import { authService } from "./auth.service";
import { SignUpRequestDto } from "./dto/auth.req.dto";
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
    this.setHeader(
      "Set-Cookie",
      `__Host-refresh_token=${refreshToken}; ${cookieOption}`,
    );
    this.setStatus(201);

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
}
