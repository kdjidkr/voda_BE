import {
  Controller,
  Example,
  Get,
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
import { usersService } from "./users.service";
import { UserMeResponseDto } from "./dto/users.res.dto";

@Route("users")
@Tags("User")
export class UsersController extends Controller {
  @Security("jwt")
  @SuccessResponse(200, "내 정보 조회 성공")
  @Example<ApiResponse<UserMeResponseDto>>({
    success: true,
    data: {
      user_id: "uuid-1234",
      profile: {
        nickname: "코딩하는 고양이",
        email: "user@example.com",
        profile_image: "https://example.com/profile.png",
        gender: "FEMALE",
        age: 28,
      },
      stats: {
        streak: 5,
        total_diaries: 42,
      },
      accounts: ["GOOGLE", "KAKAO"],
    },
  })
  @Response<ApiResponse<null>>(401, "액세스 토큰이 유효하지 않은 경우", {
    success: false,
    error: {
      code: "AUTH008",
      message: "액세스 토큰이 유효하지 않습니다.",
    },
  })
  @Response<ApiResponse<null>>(404, "사용자를 찾을 수 없는 경우", {
    success: false,
    error: {
      code: "USER001",
      message: "사용자 정보를 찾을 수 없습니다.",
    },
  })
  @Get("me")
  public async getMe(
    @Request() req: any,
  ): Promise<ApiResponse<UserMeResponseDto>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    const result = await usersService.getMe(userId);

    return {
      success: true,
      data: result,
    };
  }

  @Get("/")
  public async getUsers(): Promise<string> {
    const message = "Hello Tsoa!";
    return message;
  }

}