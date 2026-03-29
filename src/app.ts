import bodyParser from "body-parser";
import express, {
  NextFunction,
  Request as ExRequest,
  Response as ExResponse,
} from "express";
import swaggerUi from "swagger-ui-express";

import swaggerDocument from "../build/swagger.json";
import { RegisterRoutes } from "./routes";

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
