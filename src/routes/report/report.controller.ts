import {
  Body,
  Controller,
  Delete,
  Example,
  Get,
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
import { CreateReportRequestDto } from "./dto/report.req.dto";
import {
  CreateReportResponseDto,
  GetReportListResponseDto,
  GetReportResponseDto,
} from "./dto/report.res.dto";
import { reportService } from "./report.service";

@Route("report")
@Tags("보고서 기능")
export class ReportController extends Controller {
  /**
   * @summary 월간 보고서를 생성합니다.
   * @description AI가 생성한 분석 내용을 받아 월간 보고서를 저장합니다. 같은 월의 보고서가 이미 있으면 오류가 발생합니다.
   */
  @Security("jwt")
  @SuccessResponse(201, "월간 보고서 생성 성공")
  @Example<CreateReportRequestDto>({
    baseDate: "2025-09-01",
    summary: {
      text: "(닉네임)의 한 달 분석 텍스트...",
      photoCount: 3,
      diaryCount: 15,
    },
    detailsJson: {
      photos: [
        "https://s3.../photo1.jpg",
        "https://s3.../photo2.jpg",
        "https://s3.../photo3.jpg",
      ],
      aiAnalysis: "AI가 바라본 9월의 분석...",
      diaryIds: [
        "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
        "58d5db0b-5837-4933-b2d4-f032cb7a8a65",
      ],
    },
  })
  @Example<ApiResponse<CreateReportResponseDto>>({
    success: true,
    data: {
      reportId: "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
      reportType: "MONTHLY",
      baseDate: new Date("2025-09-01"),
      summary: {
        text: "(닉네임)의 한 달 분석 텍스트...",
        photoCount: 3,
        diaryCount: 15,
      },
      detailsJson: {
        photos: [
          "https://s3.../photo1.jpg",
          "https://s3.../photo2.jpg",
          "https://s3.../photo3.jpg",
        ],
        aiAnalysis: "AI가 바라본 9월의 분석...",
        diaryIds: [
          "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
          "58d5db0b-5837-4933-b2d4-f032cb7a8a65",
        ],
      },
      createdAt: new Date("2026-04-30T09:00:00.000Z"),
    },
  })
  @Response<ApiResponse<null>>(400, "요청 본문이 올바르지 않은 경우", {
    success: false,
    error: {
      code: "INVALID001",
      message: "요청 본문이 올바르지 않습니다.",
    },
  })
  @Response<ApiResponse<null>>(
    409,
    "같은 월의 보고서가 이미 존재하는 경우",
    {
      success: false,
      error: {
        code: "REPORT002",
        message: "해당 보고서가 이미 존재합니다.",
      },
    },
  )
  @Response<ApiResponse<null>>(401, "액세스 토큰이 유효하지 않은 경우", {
    success: false,
    error: {
      code: "AUTH008",
      message: "액세스 토큰이 유효하지 않습니다.",
    },
  })
  @Post("/")
  public async createReport(
    @Body() requestBody: CreateReportRequestDto,
    @Request() req: any,
  ): Promise<ApiResponse<CreateReportResponseDto>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    const result = await reportService.createReport(userId, requestBody);
    this.setStatus(201);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * @summary 모든 월간 보고서를 조회합니다.
   * @description 사용자의 모든 보고서를 base_date 최신순으로 조회합니다.
   */
  @Security("jwt")
  @SuccessResponse(200, "월간 보고서 목록 조회 성공")
  @Example<ApiResponse<GetReportListResponseDto>>({
    success: true,
    data: {
      limit: 20,
      count: 2,
      nextCursor: "58d5db0b-5837-4933-b2d4-f032cb7a8a65",
      reports: [
        {
          reportId: "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
          baseDate: new Date("2025-09-01"),
        },
        {
          reportId: "58d5db0b-5837-4933-b2d4-f032cb7a8a65",
          baseDate: new Date("2025-08-01"),
        },
      ],
    },
  })
  @Response<ApiResponse<null>>(401, "액세스 토큰이 유효하지 않은 경우", {
    success: false,
    error: {
      code: "AUTH008",
      message: "액세스 토큰이 유효하지 않습니다.",
    },
  })
  @Get("/")
  public async getReports(
    @Request() req: any,
    @Query() limit?: string,
    @Query() cursor?: string,
  ): Promise<ApiResponse<GetReportListResponseDto>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    const result = await reportService.getReports(userId, limit, cursor);
    this.setStatus(200);

    return {
      success: true,
      data: result,
    };
  }
  
  /**
   * @summary 특정 연도/월에 해당하는 월간 보고서를 조회합니다.
   * @description 쿼리 파라미터로 `year`와 `month`를 전달하면 해당 월의 보고서를 반환합니다.
   */
  @Security("jwt")
  @SuccessResponse(200, "월간 보고서 조회 성공")
  @Example<ApiResponse<GetReportResponseDto>>({
    success: true,
    data: {
      reportId: "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
      reportType: "MONTHLY",
      baseDate: new Date("2025-09-01"),
      summary: {
        text: "(닉네임)의 한 달 분석 텍스트...",
        photoCount: 3,
        diaryCount: 15,
      },
      detailsJson: {
        photos: [
          "https://s3.../photo1.jpg",
          "https://s3.../photo2.jpg",
          "https://s3.../photo3.jpg",
        ],
        aiAnalysis: "AI가 바라본 9월의 분석...",
        diaryIds: [
          "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
          "58d5db0b-5837-4933-b2d4-f032cb7a8a65",
        ],
      },
      createdAt: new Date("2026-04-30T09:00:00.000Z"),
    },
  })
  @Response<ApiResponse<null>>(400, "year 또는 month 형식이 올바르지 않은 경우", {
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
  @Response<ApiResponse<null>>(404, "조회할 보고서가 없는 경우", {
    success: false,
    error: {
      code: "REPORT001",
      message: "조회할 보고서를 찾을 수 없습니다.",
    },
  })
  @Get("/month")
  public async getReportByMonth(
    @Query() year: number,
    @Query() month: number,
    @Request() req: any,
  ): Promise<ApiResponse<GetReportResponseDto>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    const result = await reportService.getReportByMonth(userId, year, month);
    this.setStatus(200);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * @summary 월간 보고서를 조회합니다.
   */
  @Security("jwt")
  @SuccessResponse(200, "월간 보고서 조회 성공")
  @Example<ApiResponse<GetReportResponseDto>>({
    success: true,
    data: {
      reportId: "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
      reportType: "MONTHLY",
      baseDate: new Date("2025-09-01"),
      summary: {
        text: "(닉네임)의 한 달 분석 텍스트...",
        photoCount: 3,
        diaryCount: 15,
      },
      detailsJson: {
        photos: [
          "https://s3.../photo1.jpg",
          "https://s3.../photo2.jpg",
          "https://s3.../photo3.jpg",
        ],
        aiAnalysis: "AI가 바라본 9월의 분석...",
        diaryIds: [
          "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
          "58d5db0b-5837-4933-b2d4-f032cb7a8a65",
        ],
      },
      createdAt: new Date("2026-04-30T09:00:00.000Z"),
    },
  })
  @Response<ApiResponse<null>>(400, "reportId가 UUID 형식이 아닌 경우", {
    success: false,
    error: {
      code: "INVALID007",
      message: "UUID 형식이 올바르지 않습니다.",
    },
  })
  @Response<ApiResponse<null>>(401, "액세스 토큰이 유효하지 않은 경우", {
    success: false,
    error: {
      code: "AUTH008",
      message: "액세스 토큰이 유효하지 않습니다.",
    },
  })
  @Response<ApiResponse<null>>(404, "조회할 보고서가 없는 경우", {
    success: false,
    error: {
      code: "REPORT001",
      message: "조회할 보고서를 찾을 수 없습니다.",
    },
  })
  @Get("{reportId}")
  public async getReport(
    @Path() reportId: string,
    @Request() req: any,
  ): Promise<ApiResponse<GetReportResponseDto>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    const result = await reportService.getReport(userId, reportId);
    this.setStatus(200);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * @summary 월간 보고서를 삭제합니다.
   */
  @Security("jwt")
  @SuccessResponse(200, "월간 보고서 삭제 성공")
  @Delete("{reportId}")
  public async deleteReport(
    @Path() reportId: string,
    @Request() req: any,
  ): Promise<ApiResponse<null>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    await reportService.deleteReport(userId, reportId);
    this.setStatus(200);

    return {
      success: true,
      data: null,
    };
  }

  /**
   * @summary 주간 보고서를 삭제합니다.
   */
  @Security("jwt")
  @SuccessResponse(200, "주간 보고서 삭제 성공")
  @Response<ApiResponse<null>>(400, "reportId가 UUID 형식이 아닌 경우", {
    success: false,
    error: {
      code: "INVALID007",
      message: "UUID 형식이 올바르지 않습니다.",
    },
  })
  @Response<ApiResponse<null>>(401, "액세스 토큰이 유효하지 않은 경우", {
    success: false,
    error: {
      code: "AUTH008",
      message: "액세스 토큰이 유효하지 않습니다.",
    },
  })
  @Response<ApiResponse<null>>(404, "삭제할 보고서가 없는 경우", {
    success: false,
    error: {
      code: "REPORT001",
      message: "조회할 보고서를 찾을 수 없습니다.",
    },
  })
  @Delete("/weekly/{reportId}")
  public async deleteWeeklyReport(
    @Path() reportId: string,
    @Request() req: any,
  ): Promise<ApiResponse<null>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    await reportService.deleteWeeklyReport(userId, reportId);
    this.setStatus(200);

    return {
      success: true,
      data: null,
    };
  }

  /**
   * @summary 주간 보고서를 생성합니다.
   * @description AI가 생성한 분석 내용을 받아 주간 보고서를 저장합니다. 같은 주의 보고서가 이미 있으면 오류가 발생합니다.
   */
  @Security("jwt")
  @SuccessResponse(201, "주간 보고서 생성 성공")
  @Example<CreateReportRequestDto>({
    baseDate: "2025-09-01",
    summary: {
      text: "(닉네임)의 첫째 주 분석 텍스트...",
      photoCount: 3,
      diaryCount: 4,
    },
    detailsJson: {
      photos: [
        "https://s3.../photo1.jpg",
        "https://s3.../photo2.jpg",
        "https://s3.../photo3.jpg",
      ],
      aiAnalysis: "AI가 바라본 9월 첫째 주의 분석...",
      diaryIds: [
        "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
        "58d5db0b-5837-4933-b2d4-f032cb7a8a65",
        "58d5db0b-5837-4933-b2d4-f032cb7a8a66",
        "58d5db0b-5837-4933-b2d4-f032cb7a8a67",
      ],
      weeklyBreakdown: [
        {
          date: "2025-09-01",
          dayOfWeek: "Monday",
          dailyAnalysis: "훠궈를 드셨네요 맛있어서 행복했던 날이에요! 🍜",
          photos: ["https://s3.../photo1.jpg"],
          diaryId: "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
        },
        {
          date: "2025-09-02",
          dayOfWeek: "Tuesday",
          dailyAnalysis: "회사에서 실수해서 많이 우울했던 날이에요 ☔",
          photos: ["https://s3.../photo2.jpg"],
          diaryId: "58d5db0b-5837-4933-b2d4-f032cb7a8a65",
        },
        {
          date: "2025-09-05",
          dayOfWeek: "Friday",
          dailyAnalysis: "친구들이랑 만나서 신나게 놀았어요🥴",
          photos: ["https://s3.../photo3.jpg"],
          diaryId: "58d5db0b-5837-4933-b2d4-f032cb7a8a67",
        },
      ],
    },
  })
  @Example<ApiResponse<CreateReportResponseDto>>({
    success: true,
    data: {
      reportId: "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
      reportType: "WEEKLY",
      baseDate: new Date("2025-09-01"),
      summary: {
        text: "(닉네임)의 첫째 주 분석 텍스트...",
        photoCount: 3,
        diaryCount: 4,
      },
      detailsJson: {
        photos: [
          "https://s3.../photo1.jpg",
          "https://s3.../photo2.jpg",
          "https://s3.../photo3.jpg",
        ],
        aiAnalysis: "AI가 바라본 9월 첫째 주의 분석...",
        diaryIds: [
          "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
          "58d5db0b-5837-4933-b2d4-f032cb7a8a65",
          "58d5db0b-5837-4933-b2d4-f032cb7a8a66",
          "58d5db0b-5837-4933-b2d4-f032cb7a8a67",
        ],
        weeklyBreakdown: [
          {
            date: "2025-09-01",
            dayOfWeek: "Monday",
            dailyAnalysis: "훠궈를 드셨네요 맛있어서 행복했던 날이에요! 🍜",
            photos: ["https://s3.../photo1.jpg"],
            diaryId: "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
          },
          {
            date: "2025-09-02",
            dayOfWeek: "Tuesday",
            dailyAnalysis: "회사에서 실수해서 많이 우울했던 날이에요 ☔",
            photos: ["https://s3.../photo2.jpg"],
            diaryId: "58d5db0b-5837-4933-b2d4-f032cb7a8a65",
          },
          {
            date: "2025-09-05",
            dayOfWeek: "Friday",
            dailyAnalysis: "친구들이랑 만나서 신나게 놀았어요🥴",
            photos: ["https://s3.../photo3.jpg"],
            diaryId: "58d5db0b-5837-4933-b2d4-f032cb7a8a67",
          },
        ],
      },
      createdAt: new Date("2026-04-30T09:00:00.000Z"),
    },
  })
  @Response<ApiResponse<null>>(400, "요청 본문이 올바르지 않은 경우", {
    success: false,
    error: {
      code: "INVALID001",
      message: "요청 본문이 올바르지 않습니다.",
    },
  })
  @Response<ApiResponse<null>>(
    409,
    "같은 주의 보고서가 이미 존재하는 경우",
    {
      success: false,
      error: {
        code: "REPORT002",
        message: "해당 보고서가 이미 존재합니다.",
      },
    },
  )
  @Response<ApiResponse<null>>(401, "액세스 토큰이 유효하지 않은 경우", {
    success: false,
    error: {
      code: "AUTH008",
      message: "액세스 토큰이 유효하지 않습니다.",
    },
  })
  @Post("/weekly")
  public async createWeeklyReport(
    @Body() requestBody: CreateReportRequestDto,
    @Request() req: any,
  ): Promise<ApiResponse<CreateReportResponseDto>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    const result = await reportService.createWeeklyReport(userId, requestBody);
    this.setStatus(201);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * @summary 주간 보고서를 조회합니다.
   */
  @Security("jwt")
  @SuccessResponse(200, "주간 보고서 조회 성공")
  @Example<ApiResponse<GetReportResponseDto>>({
    success: true,
    data: {
      reportId: "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
      reportType: "WEEKLY",
      baseDate: new Date("2025-09-01"),
      summary: {
        text: "(닉네임)의 첫째 주 분석 텍스트...",
        photoCount: 3,
        diaryCount: 4,
      },
      detailsJson: {
        photos: [
          "https://s3.../photo1.jpg",
          "https://s3.../photo2.jpg",
          "https://s3.../photo3.jpg",
        ],
        aiAnalysis: "AI가 바라본 9월 첫째 주의 분석...",
        diaryIds: [
          "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
          "58d5db0b-5837-4933-b2d4-f032cb7a8a65",
          "58d5db0b-5837-4933-b2d4-f032cb7a8a66",
          "58d5db0b-5837-4933-b2d4-f032cb7a8a67",
        ],
        weeklyBreakdown: [
          {
            date: "2025-09-01",
            dayOfWeek: "Monday",
            dailyAnalysis: "훠궈를 드셨네요 맛있어서 행복했던 날이에요! 🍜",
            photos: ["https://s3.../photo1.jpg"],
            diaryId: "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
          },
        ],
      },
      createdAt: new Date("2026-04-30T09:00:00.000Z"),
    },
  })
  @Response<ApiResponse<null>>(400, "reportId가 UUID 형식이 아닌 경우", {
    success: false,
    error: {
      code: "INVALID007",
      message: "UUID 형식이 올바르지 않습니다.",
    },
  })
  @Response<ApiResponse<null>>(401, "액세스 토큰이 유효하지 않은 경우", {
    success: false,
    error: {
      code: "AUTH008",
      message: "액세스 토큰이 유효하지 않습니다.",
    },
  })
  @Response<ApiResponse<null>>(404, "조회할 보고서가 없는 경우", {
    success: false,
    error: {
      code: "REPORT001",
      message: "조회할 보고서를 찾을 수 없습니다.",
    },
  })
  @Get("/weekly/{reportId}")
  public async getWeeklyReport(
    @Path() reportId: string,
    @Request() req: any,
  ): Promise<ApiResponse<GetReportResponseDto>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    const result = await reportService.getWeeklyReport(userId, reportId);
    this.setStatus(200);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * @summary 모든 주간 보고서를 조회합니다.
   * @description 사용자의 모든 주간 보고서를 base_date 최신순으로 조회합니다.
   */
  @Security("jwt")
  @SuccessResponse(200, "주간 보고서 목록 조회 성공")
  @Example<ApiResponse<GetReportListResponseDto>>({
    success: true,
    data: {
      limit: 20,
      count: 2,
      nextCursor: "58d5db0b-5837-4933-b2d4-f032cb7a8a65",
      reports: [
        {
          reportId: "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
          baseDate: new Date("2025-09-01"),
        },
        {
          reportId: "58d5db0b-5837-4933-b2d4-f032cb7a8a65",
          baseDate: new Date("2025-08-25"),
        },
      ],
    },
  })
  @Response<ApiResponse<null>>(401, "액세스 토큰이 유효하지 않은 경우", {
    success: false,
    error: {
      code: "AUTH008",
      message: "액세스 토큰이 유효하지 않습니다.",
    },
  })
  @Get("/weekly")
  public async getWeeklyReports(
    @Request() req: any,
    @Query() limit?: string,
    @Query() cursor?: string,
  ): Promise<ApiResponse<GetReportListResponseDto>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    const result = await reportService.getWeeklyReports(userId, limit, cursor);
    this.setStatus(200);

    return {
      success: true,
      data: result,
    };
  }
}
