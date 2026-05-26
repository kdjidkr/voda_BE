import "dotenv/config";

import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";

// 1. S3 클라이언트 싱글톤 생성
const s3Client = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

export const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE, // 브라우저에서 바로 보이게 설정
    key: function (req, file, cb) {
      // 파일명 중복 방지를 위해 [타임스탬프_랜덤값.확장자] 형식으로 저장
      const extension = path.extname(file.originalname);
      const fileName = `diary/${Date.now()}_${Math.floor(Math.random() * 1000)}${extension}`;
      cb(null, fileName);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 파일 용량 제한 (20MB)
});

export default s3Client;
