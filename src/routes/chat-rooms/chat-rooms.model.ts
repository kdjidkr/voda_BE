export interface ChatTextInput {
    textContent: string;
}

export interface CreateChatRoomInput {
    texts: ChatTextInput[];
}

export interface ChatMessageModel {
    chatRoomId: string;
    chatMessageId: string;
    createdAt: Date;
}

export interface ChatRoomModel {
    chatRoomId: string;
    chatmessages: ChatMessageModel[];
}
