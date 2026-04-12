import {
  Body,
  Delete,
  Controller,
  Example,
  Get,
  Path,
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
  /**
   * @summary 일기를 작성합니다.
   * @description 제목, 내용, 사진 URL 목록을 받아 기본 일기를 생성합니다.
   * @returns 생성된 일기 정보
   */
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

  /**
   * @summary 개별 일기를 조회합니다.
   * @description diary id를 받아 본인 소유 일기만 조회합니다.
   * @returns 조회된 일기 정보
   */
  @Security("jwt")
  @SuccessResponse(200, "일기 조회 성공")
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
  @Response<ApiResponse<null>>(401, "액세스 토큰이 유효하지 않은 경우", {
    success: false,
    error: {
      code: "AUTH008",
      message: "액세스 토큰이 유효하지 않습니다.",
    },
  })
  @Response<ApiResponse<null>>(
    404,
    "조회할 일기가 없거나 본인 소유가 아닌 경우",
    {
      success: false,
      error: {
        code: "DIARY002",
        message: "조회할 일기를 찾을 수 없거나 접근 권한이 없습니다.",
      },
    },
  )
  @Get("{diaryId}")
  public async getDiaryById(
    @Path() diaryId: string,
    @Request() req: any,
  ): Promise<ApiResponse<CreateBasicDiaryResponseDto>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    const result = await diariesService.getDiaryById(userId, diaryId);
    this.setStatus(200);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * @summary 일기에 첨부된 사진을 삭제합니다.
   * @description diary_photo의 id를 받아 본인 소유 사진만 삭제합니다.
   * @returns 삭제 성공 여부
   */
  @Security("jwt")
  @SuccessResponse(200, "일기 사진 삭제 성공")
  @Response<ApiResponse<null>>(400, "diaryPhotoId가 UUID 형식이 아닌 경우", {
    success: false,
    error: {
      code: "INVALID007",
      message: "유효하지 않은 UUID 형식입니다.",
    },
  })
  @Response<ApiResponse<null>>(401, "액세스 토큰이 유효하지 않은 경우", {
    success: false,
    error: {
      code: "AUTH008",
      message: "액세스 토큰이 유효하지 않습니다.",
    },
  })
  @Response<ApiResponse<null>>(404, "삭제할 사진이 없거나 본인 소유가 아닌 경우", {
    success: false,
    error: {
      code: "DIARY001",
      message: "삭제할 일기 사진을 찾을 수 없거나 삭제 권한이 없는 사진입니다",
    },
  })
  @Delete("photos/{diaryPhotoId}")
  public async deleteDiaryPhoto(
    @Path() diaryPhotoId: string,
    @Request() req: any,
  ): Promise<ApiResponse<null>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    await diariesService.deleteDiaryPhoto(userId, diaryPhotoId);
    this.setStatus(200);

    return {
      success: true,
    };
  }
}
