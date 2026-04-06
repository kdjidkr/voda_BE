import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ValidateError } from "tsoa";

import { ErrorCode } from "../errors/ErrorCodes";
import { HttpException } from "../errors/HttpException";
import type { ApiResponse } from "../interfaces/ApiResponse";

export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  // 원인 파악을 위해 서버 로그에는 원본 에러를 남깁니다.
  console.error(err);

  if (err instanceof ValidateError) {
    console.warn(`Validation Error for ${req.path}:`, err.fields);
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation Failed",
        details: err.fields,
      },
    };
    return res.status(422).json(response);
  }

  if (err instanceof HttpException) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: err.errorCode ?? `HTTP_${err.status}`,
        message: err.message,
        details: err.details,
      },
    };
    return res.status(err.status).json(response);
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: ErrorCode.UPLOAD003.code,
          message: ErrorCode.UPLOAD003.message,
          details: err.message,
        },
      };
      return res.status(ErrorCode.UPLOAD003.status).json(response);
    }

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: ErrorCode.UPLOAD002.code,
        message: ErrorCode.UPLOAD002.message,
        details: err.message,
      },
    };
    return res.status(400).json(response);
  }

  if (
    err instanceof Error &&
    "$metadata" in err &&
    "name" in err &&
    "message" in err
  ) {
    const awsError = err as Error & {
      Code?: string;
      code?: string;
      BucketName?: string;
      $metadata?: { httpStatusCode?: number };
    };

    if (awsError.Code === "NoSuchBucket" || awsError.code === "NoSuchBucket") {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: ErrorCode.UPLOAD005.code,
          message: ErrorCode.UPLOAD005.message,
          details:
            process.env.NODE_ENV === "development"
              ? {
                  bucketName: awsError.BucketName,
                  message: err.message,
                }
              : undefined,
        },
      };
      return res.status(ErrorCode.UPLOAD005.status).json(response);
    }

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: ErrorCode.UPLOAD002.code,
        message: ErrorCode.UPLOAD002.message,
        details:
          process.env.NODE_ENV === "development"
            ? {
                name: err.name,
                message: err.message,
                metadata: (err as { $metadata?: unknown }).$metadata,
              }
            : undefined,
      },
    };
    return res.status(ErrorCode.UPLOAD002.status).json(response);
  }

  if (err instanceof Error && err.message.includes("Unexpected end of form")) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: ErrorCode.UPLOAD004.code,
        message: ErrorCode.UPLOAD004.message,
        details:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      },
    };
    return res.status(ErrorCode.UPLOAD004.status).json(response);
  }

  if (err instanceof Error) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal Server Error",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
    };
    return res.status(500).json(response);
  }

  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: "UNKNOWN_ERROR",
      message: "Unknown error occurred",
    },
  };
  return res.status(500).json(response);
}
