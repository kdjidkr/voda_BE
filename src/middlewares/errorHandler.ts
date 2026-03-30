import { NextFunction, Request, Response } from "express";
import { ValidateError } from "tsoa";

import type { ApiResponse } from "../interfaces/ApiResponse";
import { HttpException } from "../errors/HttpException";

export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response {
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