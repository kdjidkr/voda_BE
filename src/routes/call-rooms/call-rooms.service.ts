import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";

import { CreateCallTextRequestDto } from "./dto/call-rooms.req.dto"
import { 
  CallTextResponseDto, 
  CreateCallRoomResponseDto,
  GetCallRoomResponseDto,
} from "./dto/call-rooms.res.dto";
import { callRoomsRepository } from "./call-rooms.repository";
import { CallTextInput } from "./call-rooms.model";


export class CallRoomsService {
  async createCallRoom(): Promise<CreateCallRoomResponseDto> {
    const createdCallRoom = await callRoomsRepository.createCallRoom();

    return {
      callRoomId: createdCallRoom.call_room_id,
    };
  }

  async createCallText(
    callRoomId: string,
    requestBody: CreateCallTextRequestDto
  ): Promise<CallTextResponseDto> {
    if (requestBody.textContent.trim() === "") {
    throw new HttpException(ErrorCode.CALL_ROOM002);
  }

  const input: CallTextInput = {
    callRoomId,
    textContent: requestBody.textContent,
  };

  const createdText = await callRoomsRepository.createCallText(input);

    return{
      callTextId: createdText.call_text_id,
      textContent: createdText.text_content,
      createdAt: createdText.created_at,
    }
  }

   async getCallRoom(callRoomId: string): Promise<GetCallRoomResponseDto> {
    const callRoom = await callRoomsRepository.findCallRoomById(callRoomId);

    if (!callRoom) {
      throw new HttpException(ErrorCode.CALL_ROOM003);
    }

    return {
      callRoomId: callRoom.call_room_id,
      callTexts: callRoom.call_text.map((text) => ({
        callTextId: text.call_text_id,
        callRoomId: text.call_room_id,
        textContent: text.text_content,
        createdAt: text.created_at,
      })),
    }
  }

}

export const callRoomsService = new CallRoomsService();