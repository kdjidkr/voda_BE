export interface CallTextInput {
    textContent: string;
}

export interface CreateCallRoomInput {
    texts: CallTextInput[];
}

export interface CallTextModel {
    callRoomId: string;
    callTextId: string;
    createdAt: Date;
}

export interface CallRoomModel {
    callRoomId: string;
    callTexts: CallTextModel[];
}