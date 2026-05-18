import { prisma } from "../../config/prisma";
import { ChatMessageInput } from "./chat-rooms.model";


export class ChatRoomsRepository {
  async createChatRoom() {
    return await prisma.chat_room.create({
      data: {},
    });
  }

  async createChatMessage(input: ChatMessageInput) {
    return await prisma.chat_message.create({
      data: {
        chat_room_id: input.chatRoomId,
        text_content: input.textContent,
      }
    });
  }

  async findChatRoomById(chatRoomId: string) {
    return await prisma.chat_room.findUnique({
      where: {
        chat_room_id: chatRoomId,
      },
      include: {
        chat_message: true,
          orderBy: {
            created_at: "asc",
          },
      },
    });
  } 
}

export const chatRoomsRepository = new ChatRoomsRepository();

