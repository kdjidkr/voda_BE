import {
  Body,
  Controller,
  Delete,
  Example,
  Post,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";

import { ApiResponse } from "../../interfaces/ApiResponse";

import { CreateCallRoomResponseDto } from "./dto/call-rooms.res.dto";
import { CreateCallRoomRequestDto } from "./dto/call-rooms.req.dto";
import { callRoomsService } from "./call-rooms.service";

@Route("call-rooms")
@Tags("통화 내용 기록 관리")
export class CallRoomsController extends Controller {
  /**
   * @summary 통화 내용을 DB에 저장합니다.
   * @description 통화 내용 텍스트로 받아 DB에 저장합니다. 
   * @returns 저장된 통화 내용 
   */
  @Security("jwt")
  @SuccessResponse(201, "통화 내용이 저장 성공")
  @Example<ApiResponse<CreateCallRoomResponseDto>>({
  success: true,
    data: {
      callRoomId: "550e8400-e29b-41d4-a716-446655440000",
      callTexts: [
        {
          callTextId: "660e8400-e29b-41d4-a716-446655440000",
          callRoomId: "550e8400-e29b-41d4-a716-446655440000",
          textContent: "안녕하세요, 오늘은 수요일이네요. 수영 강습은 잘 다녀오셨나요?",
          createdAt: new Date("2026-05-14T00:00:00.000Z"),
        },
        {
          callTextId: "770e8400-e29b-41d4-a716-446655440000",
          callRoomId: "550e8400-e29b-41d4-a716-446655440000",
          textContent: "오늘 사실 수영 강습에 가지 못했어 몸이 많이 안 좋았거든... 그래서 조금 쉬었어",
          createdAt: new Date("2026-05-14T00:01:00.000Z"),
        },
      ],
    },
  })
  @Response<ApiResponse<null>>(400, "통화 내용은 최소 1개 이상이어야 합니다.", {
    success: false,
    error: {
      code: "CALL_ROOM001",
      message: "통화 내용은 최소 1개 이상이어야 합니다.",
    },
  })
  @Response<ApiResponse<null>>(400, "통화 내용은 공백일 수 없습니다.", {
    success: false,
    error: {
      code: "CALL_ROOM002",
      message: "통화 내용은 공백일 수 없습니다.",
    },
  })
  @Post("/")
  public async createCallRoom(
    @Body() request: CreateCallRoomRequestDto
  ): Promise<ApiResponse<CreateCallRoomResponseDto>> {
    this.setStatus(201);

    const data = await callRoomsService.createCallRoom(request);

    return {
      success: true,
      data,
    };
  }
}
