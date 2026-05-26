export interface CreateCallRoomResponseDto {
  callRoomId: string;
}

export interface CallTextResponseDto {
  callTextId: string;
  textContent: string;
  createdAt: Date;
}

export interface GetCallRoomResponseDto {
  callRoomId: string;
  callTexts: CallTextResponseDto[];
}