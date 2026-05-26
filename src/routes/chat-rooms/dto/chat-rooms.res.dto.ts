export interface CreateChatRoomResponseDto {
  chatRoomId: string;
}

export interface ChatMessageResponseDto {
  chatMessageId: string;
  textContent: string;
  createdAt: Date;
}

export interface GetChatRoomResponseDto {
  chatRoomId: string;
  chatMessages: ChatMessageResponseDto[];
}
