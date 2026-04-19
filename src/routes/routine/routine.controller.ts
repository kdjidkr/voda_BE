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
import { CreateRoutineRequestDto } from "./dto/routine.req.dto";
import { CreateRoutineResponseDto } from "./dto/routine.res.dto";
import { routineService } from "./routine.service";

@Route("routine")
@Tags("루틴 기능")
export class RoutineController extends Controller {
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
}
