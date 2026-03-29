import express, { Response as ExResponse, Request as ExRequest, NextFunction } from "express";
import bodyParser from "body-parser";
import swaggerUi from "swagger-ui-express";
import { RegisterRoutes } from "./routes"; // ⚠️ tsoa 실행 전엔 빨간 줄이 뜰 수 있어요!

// resolveJsonModule 덕분에 가능해진 깔끔한 import!
import swaggerDocument from "../build/swagger.json"; 

export const app = express();

// 1. 미들웨어 설정 (데이터 파싱)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 2. Swagger UI 설정 (API 문서 자동화)
// http://localhost:3000/docs 로 접속하면 확인 가능합니다.
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 3. Tsoa가 생성한 라우트 등록
RegisterRoutes(app);

// 4. 에러 핸들링
app.use((err: any, req: ExRequest, res: ExResponse, next: NextFunction) => {
  res.status(err.status || 500).json({
    message: err.message || "서버 내부 에러 발생! 로그를 확인하세요. 🦾",
    errors: err.fields,
  });
});