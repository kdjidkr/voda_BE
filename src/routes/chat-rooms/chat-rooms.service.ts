import { HttpException } from "../../errors/HttpException";
import { ErrorCode } from "../../errors/ErrorCodes";

import { CreateChatRoomRequestDto } from "./dto/chat-rooms.req.dto"
import { CreateChatRoomResponseDto } from "./dto/chat-rooms.res.dto";
import { chatRoomsRepository } from "./chat-rooms.repository";
import { CreateChatRoomInput } from "./chat-rooms.model";

export class ChatRoomsService {
    async createChatRoom(requestBody: CreateChatRoomRequestDto) {
        if (requestBody.texts.length === 0) {
            throw new HttpException(ErrorCode.CHAT_ROOM001);
        }

        for (const text of requestBody.texts) {
            if (text.textContent.trim() === "") {
                throw new HttpException(ErrorCode.CHAT_ROOM002);
            }
        }

        const input: CreateChatRoomInput = {
            texts: requestBody.texts,
        };

        const createdChatRoom = await chatRoomsRepository.createChatRoom(input);

        // 응답 DTO로 변환
        const responseDto: CreateChatRoomResponseDto = {
            chatRoomId: createdChatRoom.chat_room_id,
            chatMessages: createdChatRoom.chat_message.map((message) => ({
                chatMessageId: message.chat_message_id,
                chatRoomId: createdChatRoom.chat_room_id,
                textContent: message.text_content,
                createdAt: message.created_at,
            })),
        };

        return responseDto;
        
    }
}

export const chatRoomsService = new ChatRoomsService();
