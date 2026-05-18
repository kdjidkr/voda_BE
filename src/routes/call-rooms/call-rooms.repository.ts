import { prisma } from "../../config/prisma";
import { CallTextInput } from "./call-rooms.model";


export class CallRoomsRepository {
  async createCallRoom() {
    return await prisma.call_room.create({
      data: {},
    });
  }

  async createCallText(input: CallTextInput) {
    return await prisma.call_text.create({
      data: {
        call_room_id: input.callRoomId,
        text_content: input.textContent,
      }
    });
  }

  async findCallRoomById(callRoomId: string) {
    return await prisma.call_room.findUnique({
      where: {
        call_room_id: callRoomId,
      },
      include: {
        call_text: true,
          orderBy: {
            created_at: "asc",
          },
      },
    });
  } 
}

export const callRoomsRepository = new CallRoomsRepository();
