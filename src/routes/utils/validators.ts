import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";

export const validateNickname = (nickname: string): void => {
  // 닉네임 규칙 : 한글, 영문, 언더스코어(_)만 허용, 2자 이상 8자 이하
  const nicknameRegex = /^[a-zA-Z가-힣_]{2,8}$/;
  if (!nicknameRegex.test(nickname)) {
    throw new HttpException(ErrorCode.INVALID001, { nickname });
  }
};

export const validateEmail = (email: string): void => {
  const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    throw new HttpException(ErrorCode.INVALID002, { email });
  }
};

export const validatePassword = (password: string): void => {
  // 영문, 숫자, 특수문자가 모두 포함된 8자 이상 16자 이하 조합
  const passwordRegex =
    /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,16}$/;
  if (!passwordRegex.test(password)) {
    throw new HttpException(ErrorCode.INVALID003);
  }
};

export const validateNonEmptyText = (
  value: string | undefined,
  errorCode: (typeof ErrorCode)[keyof typeof ErrorCode],
): string => {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new HttpException(errorCode);
  }

  return normalizedValue;
};

export const validatePhotoUrls = (photos?: string[]): string[] | undefined => {
  if (!photos) {
    return undefined;
  }

  const normalizedPhotos = photos.map((photo) => photo.trim());
  const hasInvalidPhoto = normalizedPhotos.some((photo) => photo.length === 0);

  if (hasInvalidPhoto) {
    throw new HttpException(ErrorCode.INVALID006);
  }

  return normalizedPhotos;
};

export const validateUuid = (
  value: string,
  errorCode: (typeof ErrorCode)[keyof typeof ErrorCode],
): string => {
  const normalizedValue = value.trim();
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(normalizedValue)) {
    throw new HttpException(errorCode, { value });
  }

  return normalizedValue;
};

export const validateYearMonth = (
  year: string,
  month: string,
  errorCode: (typeof ErrorCode)[keyof typeof ErrorCode],
): { year: number; month: number } => {
  const normalizedYear = Number(year.trim());
  const normalizedMonth = Number(month.trim());

  const isValidYear = Number.isInteger(normalizedYear) && normalizedYear > 0;
  const isValidMonth =
    Number.isInteger(normalizedMonth) &&
    normalizedMonth >= 1 &&
    normalizedMonth <= 12;

  if (!isValidYear || !isValidMonth) {
    throw new HttpException(errorCode, { year, month });
  }

  return { year: normalizedYear, month: normalizedMonth };
};
