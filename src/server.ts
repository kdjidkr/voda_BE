process.env.TZ = "Asia/Seoul";
import http from "http";
import { Server } from "socket.io";

import { app } from "./app";
import { initSocket } from "./socket/socket";

const port = process.env.PORT || 3000;

// express app을 기반으로 http 서버 생성
const server = http.createServer(app);

// socket.io 연결
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// 소켓 이벤트 등록
initSocket(io);

// 기존 app.listen 대신 server.listen 사용
server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});