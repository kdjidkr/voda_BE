import { prisma } from "../../config/prisma";
import {
  CreateCallRoomInput,
} from "./call-rooms.model";


export class CallRoomsRepository {
  async createCallRoom( input: CreateCallRoomInput) {
    return await prisma.call_room.create({
      data: {
        call_text: {
          create: input.texts.map((text) => ({
            text_content: text.textContent,
          })),
        },
      },
      include: {
        call_text: true,
      },
    });
  }
}

export const callRoomsRepository = new CallRoomsRepository();
