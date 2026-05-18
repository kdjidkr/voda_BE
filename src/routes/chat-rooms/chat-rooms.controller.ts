import {
  Body,
  Controller,
  Example,
  Post,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";

import { ApiResponse } from "../../interfaces/ApiResponse";

import { CreateChatRoomResponseDto } from "./dto/chat-rooms.res.dto";
import { CreateChatRoomRequestDto } from "./dto/chat-rooms.req.dto";
import { chatRoomsService } from "./chat-rooms.service";

@Route("chat-rooms")
@Tags("채팅 내용 기록 관리")
export class ChatRoomsController extends Controller {
  /**
   * @summary 채팅 내용을 DB에 저장합니다.
   * @description 채팅 내용 텍스트로 받아 DB에 저장합니다. 
   * @returns 저장된 채팅 내용 
   */
  @Security("jwt")
  @SuccessResponse(201, "채팅 내용이 저장 성공")
  @Example<ApiResponse<CreateChatRoomResponseDto>>({
  success: true,
    data: {
      chatRoomId: "550e8400-e29b-41d4-a716-446655440000",
      chatMessages: [
        {
          chatMessageId: "660e8400-e29b-41d4-a716-446655440000",
          chatRoomId: "550e8400-e29b-41d4-a716-446655440000",
          textContent: "안녕하세요, 오늘은 수요일이네요. 수영 강습은 잘 다녀오셨나요?",
          createdAt: new Date("2026-05-14T00:00:00.000Z"),
        },
        {
          chatMessageId: "770e8400-e29b-41d4-a716-446655440000",
          chatRoomId: "550e8400-e29b-41d4-a716-446655440000",
          textContent: "오늘 사실 수영 강습에 가지 못했어 몸이 많이 안 좋았거든... 그래서 조금 쉬었어",
          createdAt: new Date("2026-05-14T00:01:00.000Z"),
        },
      ],
    },
  })
  @Response<ApiResponse<null>>(400, "채팅 내용은 최소 1개 이상이어야 합니다.", {
    success: false,
    error: {
      code: "CHAT_ROOM001",
      message: "채팅 내용은 최소 1개 이상이어야 합니다.",
    },
  })
  @Response<ApiResponse<null>>(400, "채팅 내용은 공백일 수 없습니다.", {
    success: false,
    error: {
      code: "CHAT_ROOM002",
      message: "채팅 내용은 공백일 수 없습니다.",
    },
  })
  @Post("/")
  public async createChatRoom(
    @Body() request: CreateChatRoomRequestDto
  ): Promise<ApiResponse<CreateChatRoomResponseDto>> {
    this.setStatus(201);

    const data = await chatRoomsService.createChatRoom(request);

    return {
      success: true,
      data,
    };
  }
}
