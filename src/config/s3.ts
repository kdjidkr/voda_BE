import "dotenv/config";

import { S3Client } from "@aws-sdk/client-s3";
import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";

// 1. S3 사용 여부 확인 (환경변수 존재 여부)
const useS3 = !!(
  process.env.S3_ACCESS_KEY_ID &&
  process.env.S3_SECRET_ACCESS_KEY &&
  process.env.S3_REGION &&
  process.env.AWS_S3_BUCKET_NAME
);

let storage: multer.StorageEngine;
let s3Client: S3Client | undefined;

if (useS3) {
  s3Client = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });

  storage = multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const extension = path.extname(file.originalname);
      const fileName = `diary/${Date.now()}_${Math.floor(Math.random() * 1000)}${extension}`;
      cb(null, fileName);
    },
  });
} else {
  console.warn("⚠️ AWS S3 환경변수가 설정되지 않아 로컬 메모리 스토리지(MemoryStorage)를 사용합니다.");
  storage = multer.memoryStorage();
}

export const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 파일 용량 제한 (20MB)
});

export default s3Client;
