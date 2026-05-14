export interface ChatMessageResponseDto {
    chatMessageId: string;
    chatRoomId: string;
    textContent: string;
    createdAt: Date;
}

export interface CreateChatRoomResponseDto {
    chatRoomId: string;
    chatMessages: ChatMessageResponseDto[];
}
