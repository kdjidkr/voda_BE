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
import { CreateRoutineRequestDto } from "./dto/routine.req.dto";
import {
  CreateRoutineResponseDto,
  GetRoutineListResponseDto,
} from "./dto/routine.res.dto";
import { routineService } from "./routine.service";

@Route("routine")
@Tags("루틴 기능")
export class RoutineController extends Controller {
  /**
   * @summary 루틴 목록을 조회합니다.
   * @description tab 쿼리는 문자열로 받으며, 허용값은 incomplete, scheduled, completed 입니다.
   */
  @Security("jwt")
  @SuccessResponse(200, "루틴 목록 조회 성공")
  @Example<ApiResponse<GetRoutineListResponseDto>>({
    success: true,
    data: {
      tab: "scheduled",
      count: 1,
      routines: [
        {
          routineId: "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
          content: "수영 레슨",
          type: "WEEKLY",
          daysOfWeek: [3, 5],
          dayOfMonth: undefined,
          scheduledFor: new Date("2026-04-22T00:00:00.000Z"),
          completedAt: undefined,
        },
      ],
    },
  })
  @Response<ApiResponse<null>>(400, "tab 값이 올바르지 않은 경우", {
    success: false,
    error: {
      code: "INVALID021",
      message: "루틴 조회 탭(tab) 값이 올바르지 않습니다.",
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
  public async getRoutines(
    @Request() req: any,
    @Query() tab?: string,
  ): Promise<ApiResponse<GetRoutineListResponseDto>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    const result = await routineService.getRoutines(userId, tab);
    this.setStatus(200);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * @summary 루틴을 등록합니다.
   * @description
   * type 입력 문자열 허용값: DAILY | WEEKLY | MONTHLY
   * daysOfWeek 허용값: 1(월)~7(일) 정수 배열
   * dayOfMonth 허용값: 1~31 정수
   * WEEKLY는 daysOfWeek를 비우면 "주에 최소 1회" 의미로 저장됩니다.
   * MONTHLY는 dayOfMonth를 비우면 "월에 최소 1회" 의미로 저장됩니다.
   * MONTHLY에서 dayOfMonth를 지정하면 해당 일자 루틴으로 저장됩니다.
   */
  @Security("jwt")
  @SuccessResponse(201, "루틴 생성 성공")
  @Example<CreateRoutineRequestDto>({
    content: "월말 가계부 정리",
    type: "MONTHLY",
    dayOfMonth: 31,
  })
  @Example<CreateRoutineRequestDto>({
    content: "주간 운동",
    type: "WEEKLY",
    daysOfWeek: [],
  })
  @Example<CreateRoutineRequestDto>({
    content: "월간 독서",
    type: "MONTHLY",
  })
  @Example<ApiResponse<CreateRoutineResponseDto>>({
    success: true,
    data: {
      routineId: "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
      content: "월말 가계부 정리",
      type: "MONTHLY",
      daysOfWeek: [],
      dayOfMonth: 31,
      createdAt: new Date("2026-04-19T09:00:00.000Z"),
    },
  })
  @Response<ApiResponse<null>>(400, "루틴 내용이 공백인 경우", {
    success: false,
    error: {
      code: "INVALID015",
      message: "루틴 내용은 공백일 수 없습니다.",
    },
  })
  @Response<ApiResponse<null>>(400, "루틴 타입이 올바르지 않은 경우", {
    success: false,
    error: {
      code: "INVALID016",
      message: "루틴 타입은 DAILY, WEEKLY, MONTHLY 중 하나여야 합니다.",
    },
  })
  @Response<ApiResponse<null>>(400, "요일 배열 값이 올바르지 않은 경우", {
    success: false,
    error: {
      code: "INVALID017",
      message: "주간 루틴 요일은 1(월)부터 7(일) 사이의 정수여야 합니다.",
    },
  })
  @Response<ApiResponse<null>>(400, "dayOfMonth 값이 올바르지 않은 경우", {
    success: false,
    error: {
      code: "INVALID019",
      message: "월간 루틴 날짜(dayOfMonth)는 1부터 31 사이의 정수여야 합니다.",
    },
  })
  @Response<ApiResponse<null>>(
    400,
    "루틴 타입별 입력 조합이 올바르지 않은 경우",
    {
      success: false,
      error: {
        code: "INVALID020",
        message: "루틴 타입별 입력 조합이 올바르지 않습니다.",
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
  public async createRoutine(
    @Body() requestBody: CreateRoutineRequestDto,
    @Request() req: any,
  ): Promise<ApiResponse<CreateRoutineResponseDto>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    const result = await routineService.createRoutine(userId, requestBody);
    this.setStatus(201);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * @summary 루틴을 삭제합니다.
   * @description routine은 hard delete가 아닌 soft delete(deleted_at 설정)로 처리하며, history는 유지됩니다.
   */
  @Security("jwt")
  @SuccessResponse(200, "루틴 삭제 성공")
  @Response<ApiResponse<null>>(400, "routineId가 UUID 형식이 아닌 경우", {
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
  @Response<ApiResponse<null>>(
    404,
    "삭제할 루틴이 없거나 본인 소유가 아닌 경우",
    {
      success: false,
      error: {
        code: "ROUTINE001",
        message: "조회할 루틴을 찾을 수 없거나 접근 권한이 없습니다.",
      },
    },
  )
  @Delete("{routineId}")
  public async deleteRoutine(
    @Path() routineId: string,
    @Request() req: any,
  ): Promise<ApiResponse<null>> {
    const userId = req.user?.sub;

    if (!userId) {
      throw new HttpException(ErrorCode.AUTH008);
    }

    await routineService.deleteRoutine(userId, routineId);
    this.setStatus(200);

    return {
      success: true,
      data: null,
    };
  }
}
