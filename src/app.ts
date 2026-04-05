import cookieParser from "cookie-parser";
import cors, { CorsOptions } from "cors";
import express from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import swaggerDocument from "../build/swagger.json";
import { globalErrorHandler } from "./middlewares/errorHandler";
import { RegisterRoutes } from "./routes";

export const app = express();

// 쿠키 설정을 위한 cors 설정
const allowedOrigins = (
  process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
};

// 1. 미들웨어 설정 (데이터 파싱)
app.use(morgan("dev"));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 2. Swagger UI 설정 (API 문서 자동화)
// http://localhost:3000/docs 로 접속하면 확인 가능합니다.
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 3. Tsoa가 생성한 라우트 등록
RegisterRoutes(app);

// 글로벌 에러 핸들러 (반드시 라우트 뒤에!)
app.use(globalErrorHandler);
