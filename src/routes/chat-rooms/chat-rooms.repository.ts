import { prisma } from "../../config/prisma";
import {
  CreateChatRoomInput,
} from "./chat-rooms.model";


export class ChatRoomsRepository {
  async createChatRoom( input: CreateChatRoomInput) {
    return await prisma.chat_room.create({
      data: {
        chat_message: {
          create: input.texts.map((text) => ({
            text_content: text.textContent,
          })),
        },
      },
      include: {
        chat_message: true,
      },
    });
  }
}

export const chatRoomsRepository = new ChatRoomsRepository();
