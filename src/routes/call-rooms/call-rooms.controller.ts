import {
  Body,
  Controller,
  Example,
  Get,
  Path,
  Post,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";

import { ApiResponse } from "../../interfaces/ApiResponse";
import { callRoomsService } from "./call-rooms.service";
import { 
  CreateCallRoomResponseDto, 
  CallTextResponseDto,
  GetCallRoomResponseDto,
} from "./dto/call-rooms.res.dto";
import { CreateCallTextRequestDto } from "./dto/call-rooms.req.dto";

@Route("call-rooms")
@Tags("통화 내용 기록 관리")
export class CallRoomsController extends Controller {
  /**
   * @summary 통화 방을 생성합니다.
   * @description 새로운 통화 방을 생성하고, 생성된 통화 방의 ID를 반환합니다.
   * @returns 생성된 통화 방의 ID
   */
  @Security("jwt")
  @SuccessResponse("201", "통화 방 생성 성공")
  @Example<ApiResponse<CreateCallRoomResponseDto>>({
    success: true,
    data: {
      callRoomId: "123e4567-e89b-12d3-a456-426614174000",
    },
  })
  @Response<ApiResponse<null>>(401, "액세스 토큰이 유효하지 않은 경우", {
    success: false,
    error: {
      code: "AUTH008",
      message: "액세스 토큰이 유효하지 않습니다.",
    },
  })
  @Post()
  public async createCallRoom(): Promise<ApiResponse<CreateCallRoomResponseDto>> {
    this.setStatus(201);

    const data = await callRoomsService.createCallRoom();

    return {
      success: true,
      data,
    };
  }

  /**
   * @summary 통화 내용 단일 텍스트를 생성합니다.
   * @description 특정 통화 방에 단일 텍스트 내용을 추가합니다.
   * @returns 생성된 통화 내용 텍스트 정보
   */
  @Security("jwt")
  @SuccessResponse("201", "통화 내용 텍스트 생성 성공")
  @Example<ApiResponse<CallTextResponseDto>>({
    success: true,
    data: {
      callTextId: "123e4567-e89b-12d3-a456-426614174000",
      textContent: "오늘 사실 강습에 가지 못했어 몸이 많이 안 좋았거든... 그래서 조금 쉬었어",
      createdAt: new Date(),
    },
  })  
  @Response<ApiResponse<null>>(400, "통화 내용 텍스트가 공백인 경우", {
    success: false,
    error: {
      code: "CALL_ROOM002",
      message: "통화 내용 텍스트는 공백일 수 없습니다.",
    },
  })
  @Response<ApiResponse<null>>(404, "존재하지 않는 통화 방인 경우", {
    success: false,
    error: {
      code: "CALL_ROOM003",
      message: "존재하지 않는 통화 방입니다.",
    },
  })
  @Post("{callRoomId}/texts")
  public async createCallText(
    @Path() callRoomId: string,
    @Body() requestBody: CreateCallTextRequestDto
  ): Promise<ApiResponse<CallTextResponseDto>> {
    this.setStatus(201);

    const data = await callRoomsService.createCallText(callRoomId, requestBody);

    return {
      success: true,
      data,
    };
  }

  /**
   * @summary 통화 방의 전체 대화 내용을 조회합니다.
   * @description 특정 통화 방의 ID를 기반으로 해당 통화 방의 전체 대화 내용을 조회합니다.
   * @returns 통화 방의 대화 내용 전체
   */
  @Security("jwt")
  @SuccessResponse("200", "통화 방 조회 성공")
  @Example<ApiResponse<GetCallRoomResponseDto>>({
    success: true,
    data: {
      callRoomId: "123e4567-e89b-12d3-a456-426614174000",
      callTexts: [
        {
          callTextId: "123e4567-e89b-12d3-a456-426614174001",
          textContent: "안녕하세요 (닉네임)님! 오늘은 수요일이네요. 수영 강습은 잘 다녀오셨나요?",
          createdAt: new Date(),
        },
        {
          callTextId: "123e4567-e89b-12d3-a456-426614174002",
          textContent: "오늘 사실 강습에 가지 못했어 몸이 많이 안 좋았거든... 그래서 조금 쉬었어",
          createdAt: new Date(),
        }
      ]
    },
  })
  @Response<ApiResponse<null>>(404, "존재하지 않는 통화 방인 경우", {
    success: false,
    error: {
      code: "CALL_ROOM003",
      message: "존재하지 않는 통화 방입니다.",
    },
  })
  @Get("{callRoomId}")
  public async getCallRoom(
    @Path() callRoomId: string
  ): Promise<ApiResponse<GetCallRoomResponseDto>> {
    const data = await callRoomsService.getCallRoom(callRoomId);

    return {
      success: true,
      data,
    }
  }
}
