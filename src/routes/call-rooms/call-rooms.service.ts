import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";

import { CreateCallRoomRequestDto } from "./dto/call-rooms.req.dto"
import { CreateCallRoomResponseDto } from "./dto/call-rooms.res.dto";
import { callRoomsRepository } from "./call-rooms.repository";
import { CreateCallRoomInput } from "./call-rooms.model";


export class CallRoomsService {
  async createCallRoom(requestBody: CreateCallRoomRequestDto) {
    if (requestBody.texts.length === 0) {
      throw new HttpException(ErrorCode.CALL_ROOM001);
    }

    for (const text of requestBody.texts) {
      if (text.textContent.trim() === "") {
        throw new HttpException(ErrorCode.CALL_ROOM002);
      }
    }

    const input: CreateCallRoomInput = {
      texts: requestBody.texts,
      };

    const createdCallRoom = await callRoomsRepository.createCallRoom(input);

    // 응답 DTO로 변환
    const responseDto: CreateCallRoomResponseDto = {
      callRoomId: createdCallRoom.call_room_id,
      callTexts: createdCallRoom.call_text.map((text) => ({
        callTextId: text.call_text_id,
        callRoomId: createdCallRoom.call_room_id,
        textContent: text.text_content,
        createdAt: text.created_at,
      })),
    };

    return responseDto;
        
  }
}

export const callRoomsService = new CallRoomsService();