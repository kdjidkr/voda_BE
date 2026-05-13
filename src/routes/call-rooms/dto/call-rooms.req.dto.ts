export interface CallTextRequestDto {
    textContent: string;
}

export interface CreateCallRoomRequestDto {
    texts: CallTextRequestDto[];
}
