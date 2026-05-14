export interface ChatMessageRequestDto {
    textContent: string;
}

export interface CreateChatRoomRequestDto {
    texts: ChatMessageRequestDto[];
}
