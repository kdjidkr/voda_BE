import {
  Body,
  Controller,
  Delete,
  Example,
  FormField,
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
  UploadedFile,
} from "tsoa";

import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";
import { ApiResponse } from "../../interfaces/ApiResponse";
import { diariesService } from "./diaries.service";
import {
  CreateBasicDiaryRequestDto,
  CreateConversationDiaryRequestDto,
  CreateKeywordsRequestDto,
  PredictDiaryRequestDto,
  UpdateBasicDiaryRequestDto,
} from "./dto/diaries.req.dto";
import {
  CreateBasicDiaryResponseDto,
  CreateKeywordResponseDto,
  MonthlyDiarySummaryResponseDto,
  PredictDiaryResponseDto,
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
   * @description 3개 이상의 키워드를 받아 일기에 저장합니다.
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
  @Response<ApiResponse<null>>(400, "키워드가 3개 이상이 아닌 경우", {
    success: false,
    error: {
      code: "KEYWORD001",
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
  @Response<ApiResponse<null>>(
    404,
    "일기를 찾을 수 없거나 접근 권한이 없는 경우",
    {
      success: false,
      error: {
        code: "DIARY002",
        message: "조회할 일기를 찾을 수 없거나 접근 권한이 없습니다.",
      },
    },
  )
  @Post("{diaryId}/keywords")
  public async createKeywords(
    @Path() diaryId: string,
    @Body() requestBody: CreateKeywordsRequestDto,
    @Request() req: any,
  ): Promise<ApiResponse<CreateKeywordResponseDto>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    const result = await diariesService.createKeywords(
      userId,
      diaryId,
      requestBody.keywords,
    );
    this.setStatus(201);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * @summary 일기를 예측하고 자동으로 저장합니다.
   * @description 
   * 대상 날짜(`targetDate`)를 본체 바디로 전달받아 다음의 프로세스를 수행합니다:
   * 1. 사용자의 프로필 정보(나이, 성별) 조회 및 가공
   * 2. 대상 날짜에 예약, 생성 혹은 완료된 할 일(Todo) 목록 및 상태 조회
   * 3. 대상 날짜 이전의 최근 작성된 일기 기록 10개 조회 및 시간대순 정렬
   * 4. 준비된 페이로드를 외부 AI 예측 엔진(`https://voda-ai-api.p-e.kr/diaries/predict`)으로 전달
   * 5. AI가 예측하여 반환한 일기 텍스트를 파싱하여 백엔드 DB의 `diary` 테이블에 자동 저장(저장 시 제목 포맷: `{날짜}의 일기`, 입력 타입: `AI`)
   * 6. AI 원본 분석 응답과 DB에 자동 저장된 일기 레코드 정보(`savedDiary`)를 동기적으로 결합하여 즉시 반환
   * 
   * 프론트엔드는 이 API를 호출하는 동안 로딩 스피너(예: "AI가 일기를 쓰고 저장하는 중입니다...")를 표시하고, 응답이 성공적으로 오면 생성된 `diaryId`를 활용하여 상세 화면으로 즉시 리다이렉트 처리하기에 최적입니다.
   * 
   * @returns 예측 성공 결과 및 자동 저장된 일기 상세 정보
   */
  @Security("jwt")
  @SuccessResponse(200, "일기 예측 및 자동 저장 성공")
  @Example<ApiResponse<PredictDiaryResponseDto>>({
    success: true,
    data: {
      prediction: {
        success: true,
        data: {
          status: "success",
          predicted_date: "2026-05-27",
          predicted_diary: "푸르른 5월의 막바지, 오늘도 계획했던 일들을 차근차근 해내며 보람찬 하루를 보냈다. 오전의 상쾌한 공기를 마시며 시작한 루틴이 몸과 마음을 가볍게 해주었고, 몰입해서 업무를 처리하다 보니 어느새 창밖으로 노을이 깔리고 있었다. 사소한 성취들이 모여 나를 조금 더 단단하게 만드는 기분이 든다. 저녁에는 따뜻한 차 한 잔과 함께 오늘을 되돌아보며 온전한 휴식을 취했다. 내일도 오늘처럼만 평온하고 단단한 하루가 되기를 바란다."
        }
      },
      savedDiary: {
        diaryId: "dbf94c44-359c-4f4b-8ac9-cd5c6de2b06f",
        title: "2026-05-27의 일기",
        content: "푸르른 5월의 막바지, 오늘도 계획했던 일들을 차근차근 해내며 보람찬 하루를 보냈다. 오전의 상쾌한 공기를 마시며 시작한 루틴이 몸과 마음을 가볍게 해주었고, 몰입해서 업무를 처리하다 보니 어느새 창밖으로 노을이 깔리고 있었다. 사소한 성취들이 모여 나를 조금 더 단단하게 만드는 기분이 든다. 저녁에는 따뜻한 차 한 잔과 함께 오늘을 되돌아보며 온전한 휴식을 취했다. 내일도 오늘처럼만 평온하고 단단한 하루가 되기를 바란다.",
        diaryDate: new Date("2026-05-27T00:00:00.000Z"),
        inputType: "AI",
        createdAt: new Date("2026-05-27T02:40:00.000Z")
      }
    }
  })
  @Response<ApiResponse<null>>(401, "액세스 토큰이 없거나 유효하지 않은 경우", {
    success: false,
    error: {
      code: "AUTH008",
      message: "액세스 토큰이 유효하지 않습니다.",
    },
  })
  @Response<ApiResponse<null>>(404, "사용자 프로필이 DB에 존재하지 않는 경우", {
    success: false,
    error: {
      code: "USER001",
      message: "사용자 정보를 찾을 수 없습니다.",
    },
  })
  @Response<ApiResponse<null>>(502, "외부 AI API 서버 호출에 실패한 경우", {
    success: false,
    error: {
      code: "AI_API_ERROR",
      message: "AI API 호출에 실패했습니다: Method Not Allowed",
    },
  })
  @Response<ApiResponse<null>>(504, "외부 AI API 요청 시간이 15초를 초과한 경우", {
    success: false,
    error: {
      code: "AI_API_TIMEOUT",
      message: "AI API 요청 시간이 초과되었습니다.",
    },
  })
  @Post("predict")
  public async predictDiary(
    @Body() requestBody: PredictDiaryRequestDto,
    @Request() req: any,
  ): Promise<ApiResponse<PredictDiaryResponseDto>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    const result = await diariesService.predictDiary(userId, requestBody);
    this.setStatus(200);

    return {
      success: true,
      data: result,
    };
  }
  /**
   * @summary 음성 파일을 기반으로 일기를 예측하고 자동으로 저장합니다.
   * @description 
   * 음성 파일(`file`)과 대상 날짜(`targetDate`)를 multipart/form-data로 전달받아 다음의 프로세스를 수행합니다:
   * 1. 사용자의 프로필 정보 조회 및 가공
   * 2. 외부 AI API(`https://voda-ai-api.p-e.kr/voices`)를 호출해 STT 변환
   * 3. 외부 AI 예측 엔진(`https://voda-ai-api.p-e.kr/diaries/from-texts`)으로 변환된 텍스트 전달
   * 4. AI가 예측하여 반환한 일기 텍스트를 백엔드 DB의 `diary` 테이블에 자동 저장(저장 시 입력 타입: `VOICE`)
   * 5. 결과 반환
   * 
   * @returns 예측 성공 결과 및 자동 저장된 일기 상세 정보
   */
  @Security("jwt")
  @SuccessResponse(200, "음성 일기 예측 및 자동 저장 성공")
  @Response<ApiResponse<null>>(400, "음성 파일이 누락된 경우", {
    success: false,
    error: {
      code: "INVALID_REQUEST",
      message: "음성 파일이 필요합니다.",
    },
  })
  @Response<ApiResponse<null>>(401, "액세스 토큰이 없거나 유효하지 않은 경우", {
    success: false,
    error: {
      code: "AUTH008",
      message: "액세스 토큰이 유효하지 않습니다.",
    },
  })
  @Response<ApiResponse<null>>(502, "외부 AI API 서버 호출에 실패한 경우", {
    success: false,
    error: {
      code: "AI_API_ERROR",
      message: "AI API 호출에 실패했습니다.",
    },
  })
  @Response<ApiResponse<null>>(504, "외부 AI API 요청 시간이 초과된 경우", {
    success: false,
    error: {
      code: "AI_API_TIMEOUT",
      message: "AI API 요청 시간이 초과되었습니다.",
    },
  })
  @Post("voice-predict")
  public async predictDiaryFromVoice(
    @UploadedFile() file: Express.Multer.File,
    @FormField() targetDate: string,
    @Request() req: any,
  ): Promise<ApiResponse<PredictDiaryResponseDto>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    if (!file) {
      throw new HttpException(400, "음성 파일이 필요합니다.", "INVALID_REQUEST");
    }

    const result = await diariesService.predictDiaryFromVoice(
      userId,
      file,
      targetDate,
    );
    this.setStatus(200);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * @summary 대화 기록을 기반으로 일기를 생성하고 저장합니다.
   * @description 
   * 대화 유형(`conversationType`)과 방 ID(`roomId`)를 본체 바디로 전달받아 다음의 프로세스를 수행합니다:
   * 1. 채팅/통화 전체 대화 내용 조회 후 텍스트만 추출하여 배열 형태로 변환
   * 2. 외부 AI API(`https://voda-ai-api.p-e.kr/diaries/from-conversation`)로 대화 배열 전달
   * 3. AI가 반환한 일기 텍스트를 백엔드 DB의 `diary` 테이블에 저장 
   *  -  채팅 기반 저장 시 입력 타입: `CHAT`
   *  - 통화 기반 저장 시 입력 타입: `CALL`
   * 4. 저장된 일기 반환
   * 
   * @returns 대화 기반으로 생성 및 저장된 일기 정보
   */
  @Security("jwt")
  @SuccessResponse(201, "대화 기반 일기 생성 및 자동 저장 성공")
  @Example<ApiResponse<CreateBasicDiaryResponseDto>>({
    success: true,
      data: {
      diaryId: "dbf94c44-359c-4f4b-8ac9-cd5c6de2b06f",
      title: "대화로 작성한 일기",
      content: "오늘은 몸이 좋지 않아 수영 강습에 가지 못했다.",
      photos: [],
      inputType: "CALL",
      createdAt: new Date("2026-06-05T11:50:00.000Z"),
      inputId: "123e4567-e89b-12d3-a456-426614174000",
    },
  })
  @Response<ApiResponse<null>>(401, "액세스 토큰이 없거나 유효하지 않은 경우", {
    success: false,
    error: {
      code: "AUTH008",
      message: "액세스 토큰이 유효하지 않습니다.",
    },
  })
  @Response<ApiResponse<null>>(404, "채팅방을 찾을 수 없는 경우", {
    success: false,
    error: {
      code: "CHAT_ROOM003",
      message: "존재하지 않는 채팅방입니다.",
    },
  })
  @Response<ApiResponse<null>>(404, "통화방을 찾을 수 없는 경우", {
    success: false,
    error: {
      code: "CALL_ROOM003",
      message: "존재하지 않는 통화방입니다.",
    },
  })
  @Response<ApiResponse<null>>(502, "외부 AI API 서버 호출에 실패한 경우", {
    success: false,
    error: {
      code: "AI_API_ERROR",
      message: "AI API 호출에 실패했습니다.",
    },
  })
  @Response<ApiResponse<null>>(400, "UUID 형식이 올바르지 않은 경우", {
    success: false,
    error: {
      code: "INVALID007",
      message: "UUID 형식이 올바르지 않습니다.",
    },
  })
  @Post("conversation")
  public async createConversationDiary(
    @Body() requestBody: CreateConversationDiaryRequestDto,
    @Request() req: any,
  ): Promise<ApiResponse<CreateBasicDiaryResponseDto>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    const result = await diariesService.createConversationDiary(
      userId,
      requestBody,
    );

    this.setStatus(201);

    return {
      success: true,
      data: result,
    };
  }
}
