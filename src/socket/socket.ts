import { HttpException } from "../errors/HttpException";
import { Server } from "socket.io";

import { callRoomsService } from "../routes/call-rooms/call-rooms.service";
import { chatRoomsService } from "../routes/chat-rooms/chat-rooms.service";
import { chatRoomsRepository } from "../routes/chat-rooms/chat-rooms.repository";
import { callRoomsRepository } from "../routes/call-rooms/call-rooms.repository";

// AI 답변 요청
async function requestAiReply(payload: {
  conversation_history: string[];
  user_text: string;
}): Promise<string> {
  const response = await fetch("https://voda-ai-api.p-e.kr/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok){
    const errorText = await response.text();

    console.error(`AI 응답 API 호출 실패: Status=${response.status}, Body=${errorText}`,);

    throw new HttpException(502, "AI 응답 API 호출에 실패했습니다.", "AI_API_ERROR",);
  }

  const aiReply = await response.text();

  if(!aiReply.trim()) {
    throw new HttpException(502, "AI 응답이 비어 있습니다.", "AI_EMPTY_RESPONSE",);
  }

  return aiReply;
}

type ConversationType = "chat" | "call";

export function initSocket(io: Server) {
  io.on("connection", (socket) => {
    console.log("socket connected: ", socket.id);

    // 각 대화방에 맞는 id 생성 및 입장
    socket.on(
      "conversation:start",
      async ({type}: {type: ConversationType}) => {
        let roomId: string;

        if (type === "chat") {
          const chatRoom = await chatRoomsService.createChatRoom();
          roomId = chatRoom.chatRoomId;
        } else {
          const callRoom = await callRoomsService.createCallRoom();
          roomId = callRoom.callRoomId;
        }

        socket.join(roomId);

        socket.emit("conversation:started", {
          type,
          roomId,
        });
      },
    );
    
    // 각각 유저, AI 메세지 수신, 저장
    socket.on("conversation:message",
      async ({roomId, type, message,} : {
        type: ConversationType; roomId: string; message: string;}) => {
          try{
            const userText = `USER: ${message}`;

            if (type === "chat") {
              await chatRoomsService.createChatMessage(roomId, {
                textContent: userText,
              });
            } else {
              await callRoomsService.createCallText(roomId, {
                textContent: userText,
              });
            }

            // DB에서 지금까지의 대화 내역 전체 조회
            let conversation: string[] = [];
            if (type === "chat") {
              const chatRoom = await chatRoomsRepository.findChatRoomById(roomId);
              conversation = chatRoom?.chat_message.map((m) => m.text_content) || [];
            } else {
              const callRoom = await callRoomsRepository.findCallRoomById(roomId);
              conversation = callRoom?.call_text.map((m) => m.text_content) || [];
            }

            // 방금 저장한 마지막 유저 메시지를 제외한 내역을 conversation_history로 분리
            const conversation_history = conversation.slice(0, -1);
            const user_text = message;

            const aiReply = await requestAiReply({
              conversation_history,
              user_text,
            });
            const aiText = `AI: ${aiReply}`;

            if (type === "chat") {
              await chatRoomsService.createChatMessage(roomId, {
                textContent: aiText,
              });
            } else {
              await callRoomsService.createCallText(roomId, {
                textContent: aiText,
              });
            }

            // AI 답장
            io.to(roomId).emit("conversation:reply", {
              message: aiReply,
            });
          } catch (error) {
            console.error("conversation:message error: ", error);

            socket.emit("conversation:error", {
              message: "메세지 처리 중 오류가 발생했습니다.",
            });
          }
        },
      );
    
    // 대화 종료
    socket.on("conversation:end", 
      ({ roomId }: { roomId: string }) => {        
        io.to(roomId).emit("conversation:ended",{
          roomId,
          message: "대화가 종료됨.",
        });

        socket.leave(roomId);

        console.log("conversation ended:", roomId);
      },
    );
         
    socket.on("disconnect", () => {
      console.log("socket disconnected: ", socket.id);
    });
  });
}
