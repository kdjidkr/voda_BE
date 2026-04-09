export const ErrorCode = {
  // 인증 관련
  AUTH001: {
    code: "AUTH001",
    status: 400,
    message: "회원가입 요청 형식이 올바르지 않습니다.",
  },
  AUTH002: {
    code: "AUTH002",
    status: 409,
    message: "이미 존재하는 닉네임입니다.",
  },
  AUTH003: {
    code: "AUTH003",
    status: 409,
    message: "이미 존재하는 이메일입니다.",
  },
  AUTH004: {
    code: "AUTH004",
    status: 409,
    message: "이미 가입된 소셜 계정입니다.",
  },
  AUTH005: {
    code: "AUTH005",
    status: 500,
    message: "서버 저장소 오류가 발생했습니다.",
  },
  AUTH006: {
    code: "AUTH006",
    status: 500,
    message: "JWT 비밀키가 설정되지 않았습니다.",
  },
  AUTH007: {
    code: "AUTH007",
    status: 401,
    message: "액세스 토큰이 없습니다.",
  },
  AUTH008: {
    code: "AUTH008",
    status: 401,
    message: "액세스 토큰이 유효하지 않습니다.",
  },
  AUTH009: {
    code: "AUTH009",
    status: 401,
    message: "리프레시 토큰이 없습니다.",
  },
  AUTH010: {
    code: "AUTH010",
    status: 401,
    message: "리프레시 토큰이 유효하지 않습니다.",
  },
  AUTH011: {
    code: "AUTH011",
    status: 401,
    message: "지원하지 않는 인증 방식입니다.",
  },

  // 업로드 관련
  UPLOAD001: {
    code: "UPLOAD001",
    status: 400,
    message: "업로드할 파일이 없습니다.",
  },
  UPLOAD002: {
    code: "UPLOAD002",
    status: 500,
    message: "파일 업로드 중 저장소 오류가 발생했습니다.",
  },
  UPLOAD003: {
    code: "UPLOAD003",
    status: 413,
    message: "업로드 파일 용량 제한을 초과했습니다.",
  },
  UPLOAD004: {
    code: "UPLOAD004",
    status: 400,
    message: "multipart/form-data 요청 형식이 올바르지 않습니다.",
  },
  UPLOAD005: {
    code: "UPLOAD005",
    status: 404,
    message: "업로드 대상 S3 버킷을 찾을 수 없습니다.",
  },

  // 유효성 관련
  INVALID001: {
    code: "INVALID001",
    status: 400,
    message: "닉네임 형식이 올바르지 않습니다.",
  },
  INVALID002: {
    code: "INVALID002",
    status: 400,
    message: "이메일 형식이 올바르지 않습니다.",
  },
  INVALID003: {
    code: "INVALID003",
    status: 400,
    message: "비밀번호 형식이 올바르지 않습니다.",
  },
} as const;
