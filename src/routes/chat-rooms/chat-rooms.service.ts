import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";

import { CreateChatMessageRequestDto } from "./dto/chat-rooms.req.dto"
import { 
  CreateChatRoomRequestDto,
  ChatMessageResponseDto,
  GetChatRoomRequestDto,
} from "./dto/chat-rooms.res.dto";
import { chatRoomsRepository } from "./chat-rooms.repository";
import { ChatMessageInput } from "./chat-rooms.model";


export class ChatRoomsService {
  async createChatRoom(): Promise<CreateChatRoomRequestDto> {
    const createdChatRoom = await chatRoomsRepository.createChatRoom();

    return {
      chatRoomId: createdChatRoom.chat_room_id,
    };
  }

  async createChatMessage(
    chatRoomId: string,
    requestBody: CreateChatMessageRequestDto
  ): Promise<ChatMessageResponseDto> {
    if (requestBody.textContent.trim() === "") {
    throw new HttpException(ErrorCode.CHAT_ROOM002);
  }

  const input: ChatMessageInput = {
    chatRoomId,
    textContent: requestBody.textContent,
  };

  const createdMessage = await chatRoomsRepository.createChatMessage(input);

    return{
      chatMessageId: createdMessage.chat_message_id,
      textContent: createdMessage.text_content,
      createdAt: createdMessage.created_at,
    };
  }

   async getChatRoom(chatRoomId: string): Promise<GetChatRoomRequestDto> {
    const chatRoom = await chatRoomsRepository.findChatRoomById(chatRoomId);

    if (!chatRoom) {
      throw new HttpException(ErrorCode.CHAT_ROOM003);
    }

    return {
      chatRoomId: chatRoom.chat_room_id,
      chatMessages: chatRoom.chat_message.map((message) => ({
        chatMessageId: message.chat_message_id,
        chatRoomId: message.chat_room_id,
        textContent: message.text_content,
        createdAt: message.created_at,
      })),
    }
  }

}

export const chatRoomsService = new ChatRoomsService();
