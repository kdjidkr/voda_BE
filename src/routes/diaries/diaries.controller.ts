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
import { diariesService } from "./diaries.service";
import { CreateBasicDiaryRequestDto } from "./dto/diaries.req.dto";
import { CreateBasicDiaryResponseDto } from "./dto/diaries.res.dto";

@Route("diaries")
@Tags("다이어리 작성, 조회, 삭제 등의 기능을 담당합니다.")
export class DiariesController extends Controller {
  @Security("jwt")
  @SuccessResponse(201, "기본 일기 생성 성공")
  @Example<ApiResponse<CreateBasicDiaryResponseDto>>({
    success: true,
    data: {
      diaryId: "dbf94c44-359c-4f4b-8ac9-cd5c6de2b06f",
      title: "오늘의 기록",
      content: "산책하면서 봄 냄새를 느꼈다.",
      photos: [
        {
          photoId: "bc57f813-fd02-4b35-b9ea-a2364f493f9b",
          imageUrl:
            "https://example-bucket.s3.ap-northeast-2.amazonaws.com/diary/photo-1.jpg",
        },
      ],
      inputType: "MANUAL",
      createdAt: new Date("2026-04-11T11:50:00.000Z"),
      inputId: undefined,
    },
  })
  @Response<ApiResponse<null>>(400, "제목이 공백인 경우", {
    success: false,
    error: {
      code: "INVALID004",
      message: "일기 제목은 공백일 수 없습니다.",
    },
  })
  @Response<ApiResponse<null>>(400, "내용이 공백인 경우", {
    success: false,
    error: {
      code: "INVALID005",
      message: "일기 내용은 공백일 수 없습니다.",
    },
  })
  @Response<ApiResponse<null>>(400, "사진 URL이 공백인 경우", {
    success: false,
    error: {
      code: "INVALID006",
      message: "사진 URL 형식이 올바르지 않습니다.",
    },
  })
  @Response<ApiResponse<null>>(401, "액세스 토큰이 유효하지 않은 경우", {
    success: false,
    error: {
      code: "AUTH008",
      message: "액세스 토큰이 유효하지 않습니다.",
    },
  })
  @Post("/")
  public async createBasicDiary(
    @Body() requestBody: CreateBasicDiaryRequestDto,
    @Request() req: any,
  ): Promise<ApiResponse<CreateBasicDiaryResponseDto>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    const result = await diariesService.createBasicDiary(userId, requestBody);
    this.setStatus(201);
    return {
      success: true,
      data: result,
    };
  }
}
