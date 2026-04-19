import {
  Body,
  Controller,
  Delete,
  Example,
  Get,
  Patch,
  Path,
  Post,
  Query,
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
import {
  CreateBasicDiaryRequestDto,
  UpdateBasicDiaryRequestDto,
} from "./dto/diaries.req.dto";
import {
  CreateBasicDiaryResponseDto,
  MonthlyDiarySummaryResponseDto,
  CreateKeywordResponseDto,
} from "./dto/diaries.res.dto";

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
   * @summary 해당 월의 일기 요약을 조회합니다.
   * @description 연도와 월을 받아 날짜별로 일기 제목과 생성 시각만 반환합니다.
   * @returns 달력 화면용 일기 요약 목록
   */
  @Security("jwt")
  @SuccessResponse(200, "월 요약 조회 성공")
  @Example<ApiResponse<MonthlyDiarySummaryResponseDto>>({
    success: true,
    data: {
      year: 2025,
      month: 10,
      dates: [
        {
          date: "2025-10-06",
          diaries: [
            {
              diaryId: "0fd288a9-e674-432f-84bb-9ea42372c85e",
              title: "감기에 걸린 날",
              createdAt: new Date("2025-10-06T11:20:00.000Z"),
            },
            {
              diaryId: "11111111-2222-3333-4444-555555555555",
              title: "감기 걸림 ㅠ",
              createdAt: new Date("2025-10-06T08:10:00.000Z"),
            },
          ],
        },
      ],
    },
  })
  @Response<ApiResponse<null>>(400, "연도 또는 월 형식이 올바르지 않은 경우", {
    success: false,
    error: {
      code: "INVALID010",
      message: "연도 또는 월 형식이 올바르지 않습니다.",
    },
  })
  @Response<ApiResponse<null>>(401, "액세스 토큰이 유효하지 않은 경우", {
    success: false,
    error: {
      code: "AUTH008",
      message: "액세스 토큰이 유효하지 않습니다.",
    },
  })
  @Get("monthly-summary")
  public async getMonthlyDiarySummaries(
    @Query() year: string,
    @Query() month: string,
    @Request() req: any,
  ): Promise<ApiResponse<MonthlyDiarySummaryResponseDto>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    const result = await diariesService.getMonthlyDiarySummaries(
      userId,
      year,
      month,
    );

    this.setStatus(200);
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
   * @summary 일기를 수정합니다.
   * @description 일기의 title과 content만 수정합니다. 사진은 수정하지 않습니다.
   * @returns 수정된 일기 정보
   */
  @Security("jwt")
  @SuccessResponse(200, "일기 수정 성공")
  @Example<ApiResponse<CreateBasicDiaryResponseDto>>({
    success: true,
    data: {
      diaryId: "dbf94c44-359c-4f4b-8ac9-cd5c6de2b06f",
      title: "수정된 제목",
      content: "수정된 내용입니다.",
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
  @Response<ApiResponse<null>>(400, "diaryId가 UUID 형식이 아닌 경우", {
    success: false,
    error: {
      code: "INVALID007",
      message: "유효하지 않은 UUID 형식입니다.",
    },
  })
  @Response<ApiResponse<null>>(400, "수정할 내용이 없는 경우", {
    success: false,
    error: {
      code: "INVALID009",
      message: "수정할 필드가 없습니다.",
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
  @Response<ApiResponse<null>>(401, "액세스 토큰이 유효하지 않은 경우", {
    success: false,
    error: {
      code: "AUTH008",
      message: "액세스 토큰이 유효하지 않습니다.",
    },
  })
  @Response<ApiResponse<null>>(
    404,
    "수정할 일기가 없거나 본인 소유가 아닌 경우",
    {
      success: false,
      error: {
        code: "DIARY002",
        message: "조회할 일기를 찾을 수 없거나 접근 권한이 없습니다.",
      },
    },
  )
  @Patch("{diaryId}")
  public async updateDiaryById(
    @Path() diaryId: string,
    @Body() requestBody: UpdateBasicDiaryRequestDto,
    @Request() req: any,
  ): Promise<ApiResponse<CreateBasicDiaryResponseDto>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    const result = await diariesService.updateBasicDiary(
      userId,
      diaryId,
      requestBody,
    );
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
  @Response<ApiResponse<null>>(
    404,
    "삭제할 사진이 없거나 본인 소유가 아닌 경우",
    {
      success: false,
      error: {
        code: "DIARY001",
        message:
          "삭제할 일기 사진을 찾을 수 없거나 삭제 권한이 없는 사진입니다.",
      },
    },
  )
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

  /**
   * @summary 일기에 키워드를 추가합니다.
   * @description 정확히 3개의 키워드를 받아 일기에 저장합니다.
   * @returns 저장된 키워드 정보
   */
  @Security("jwt")
  @SuccessResponse(201, "키워드 저장 성공")
  @Example<ApiResponse<CreateKeywordResponseDto>>({
    success: true,
    data: {
      keywords: [
        {
          keywordId: "bc57f813-fd02-4b35-b9ea-a2364f493f9b",
          keyword: "월요일 9시 수업 피곤",
        },
        {
          keywordId: "cd57f813-fd02-4b35-b9ea-a2364f493f9c",
          keyword: "점심 제육 존맛",
        },
        {
          keywordId: "de57f813-fd02-4b35-b9ea-a2364f493f9d",
          keyword: "중간 끝났는데 바쁨",
        },
      ],
    },
  })
  @Response<ApiResponse<null>>(400, "키워드가 3개가 아닌 경우", {
    success: false,
    error: {
      code: "AUTH014",
      message: "키워드는 최소 3개 이상이어야 합니다.",
    },
  })
  @Response<ApiResponse<null>>(401, "액세스 토큰이 유효하지 않은 경우", {
    success: false,
    error: {
      code: "AUTH008",
      message: "액세스 토큰이 유효하지 않습니다.",
    },
  })
  @Post("{diaryId}/keywords")
  public async createKeywords(
    @Path() diaryId: string,
    @Body() requestBody: { keywords: string[] },
    @Request() req: any,
  ): Promise<ApiResponse<CreateKeywordResponseDto>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    const result = await diariesService.createKeywords(
      diaryId,
      requestBody.keywords,
    );
    this.setStatus(201);

    return {
      success: true,
      data: result,
    };
  }
}
