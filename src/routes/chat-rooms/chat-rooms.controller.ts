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
import { chatRoomsService } from "./chat-rooms.service";
import { CreateChatMessageRequestDto } from "./dto/chat-rooms.req.dto";
import { 
  ChatMessageResponseDto,
  CreateChatRoomResponseDto,
  GetChatRoomResponseDto,
 } from "./dto/chat-rooms.res.dto";

@Route("chat-rooms")
@Tags("채팅 내용 기록 관리")
export class ChatRoomsController extends Controller {
  /**
   * @summary 채팅 방을 생성합니다.
   * @description 새로운 채팅 방을 생성하고, 생성된 채팅 방의 ID를 반환합니다.
   * @returns 생성된 채팅 방의 ID
   */
  @Security("jwt")
  @SuccessResponse("201", "채팅 방 생성 성공")
  @Example<ApiResponse<CreateChatRoomResponseDto>>({
    success: true,
    data: {
      chatRoomId: "550e8400-e29b-41d4-a716-446655440000",
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
  public async createChatRoom(): Promise<ApiResponse<CreateChatRoomResponseDto>> {
    this.setStatus(201);

    const data = await chatRoomsService.createChatRoom();

    return {
      success: true,
      data,
    };
  }

  /**
   * @summary 채팅 내용을 단일 텍스트를 생성합니다.
   * @description 특정 채팅 방에 단일 텍스트 내용을 추가합니다.
   * @returns 생성된 채팅 내용 텍스트 정보 
   */
  @Security("jwt")
  @SuccessResponse(201, "채팅 내용 텍스트 생성 성공")
  @Example<ApiResponse<ChatMessageResponseDto>>({
    success: true,
    data: {
      chatMessageId: "550e8400-e29b-41d4-a716-446655440000",
      textContent: "안녕하세요",
      createdAt: new Date(),
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
  @Response<ApiResponse<null>>(404, "존재하지 않는 채팅 방인 경우", {
    success: false,
    error: {
      code: "CHAT_ROOM003",
      message: "존재하지 않는 채팅 방입니다.",
    },
  })
  @Post("{chatRoomId}/messages")
  public async createChatMessage(
    @Path() chatRoomId: string,
    @Body() requestBody: CreateChatMessageRequestDto
  ): Promise<ApiResponse<ChatMessageResponseDto>> {
    this.setStatus(201);

    const data = await chatRoomsService.createChatMessage(chatRoomId, requestBody);

    return {
      success: true,
      data,
    };
  }

  /**
   * @summary 채팅 방의 전체 대화 내용을 조회합니다.
   * @description 특정 채팅 방의 ID를 기반으로 해당 채팅 방의 전체 대화 내용을 조회합니다.
   * @returns 채팅 방의 대화 내용 전체
   */
  @Security("jwt")
  @SuccessResponse(200, "채팅 방 조회 성공")
  @Example<ApiResponse<GetChatRoomResponseDto>>({
    success: true,
    data: {
      chatRoomId: "550e8400-e29b-41d4-a716-446655440000",
      chatMessages: [
        {
          chatMessageId: "550e8400-e29b-41d4-a716-446655440001",
          textContent: "안녕하세요",
          createdAt: new Date(),
        },  
        {
          chatMessageId: "550e8400-e29b-41d4-a716-446655440002",
          textContent: "오늘 날씨가 정말 좋네요!",
          createdAt: new Date(),
        }
      ],
    },
  })
  @Response<ApiResponse<null>>(404, "존재하지 않는 채팅 방인 경우", {
    success: false,
    error: {
      code: "CHAT_ROOM003",
      message: "존재하지 않는 채팅 방입니다.",
    },
  })
  @Get("{chatRoomId}")
  public async getChatRoom(
    @Path() chatRoomId: string
  ): Promise<ApiResponse<GetChatRoomResponseDto>> {
    const data = await chatRoomsService.getChatRoom(chatRoomId);

    return {
      success: true,
      data,
    };  
  }
}
