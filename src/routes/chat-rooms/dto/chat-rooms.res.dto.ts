export interface CreateChatRoomRequestDto {
    chatRoomId: string;
}

export interface ChatMessageResponseDto {
    chatMessageId: string;
    textContent: string;
    createdAt: Date;
}

export interface GetChatRoomRequestDto {
    chatRoomId: string;
    chatMessages: ChatMessageResponseDto[];
}
