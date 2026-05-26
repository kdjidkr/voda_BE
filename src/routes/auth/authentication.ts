import * as express from "express";
import jwt from "jsonwebtoken";

import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";

/**
 * @param request Express 요청 객체
 * @param securityName @Security('이름')에 들어갈 이름
 * @param _scope scopes 권한 범위
 * @returns
 */
export async function expressAuthentication(
  request: express.Request,
  securityName: string,
  _scope?: string[],
): Promise<any> {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new HttpException(ErrorCode.AUTH006);
  }

  if (securityName === "jwt") {
    const authorizationHeader = request.headers.authorization;
    const fallbackHeader = request.headers.authentication;
    const rawHeader = authorizationHeader ?? fallbackHeader;
    const normalizedHeader = Array.isArray(rawHeader)
      ? rawHeader[0]
      : rawHeader;
    const token = normalizedHeader?.split(" ")[1];

    if (!token) {
      throw new HttpException(ErrorCode.AUTH007);
    }

    return await new Promise((resolve, reject) => {
      jwt.verify(
        token,
        jwtSecret,
        (
          err: jwt.VerifyErrors | null,
          decoded: string | jwt.JwtPayload | undefined,
        ) => {
          if (err || !decoded) {
            reject(new HttpException(ErrorCode.AUTH008));
            return;
          }
          resolve(decoded);
        },
      );
    });
  }

  if (securityName === "jwtRefresh") {
    const token =
      request.cookies?.["__Host-refresh_token"] ??
      request.cookies?.["refresh_token"];

    if (!token) {
      throw new HttpException(ErrorCode.AUTH009);
    }

    return await new Promise((resolve, reject) => {
      jwt.verify(
        token,
        jwtSecret,
        (
          err: jwt.VerifyErrors | null,
          decoded: string | jwt.JwtPayload | undefined,
        ) => {
          if (err || !decoded) {
            reject(new HttpException(ErrorCode.AUTH010));
            return;
          }
          resolve(decoded);
        },
      );
    });
  }

  throw new HttpException(ErrorCode.AUTH011, { securityName });
}
