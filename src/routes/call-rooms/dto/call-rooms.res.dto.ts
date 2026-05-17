export interface CallTextResponseDto {
  callTextId: string;
  callRoomId: string;
  textContent: string;
  createdAt: Date;
}

export interface CreateCallRoomResponseDto {
  callRoomId: string;
  callTexts: CallTextResponseDto[];
}