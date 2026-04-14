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
  AUTH012: {
    code: "AUTH012",
    status: 401,
    message: "이메일 또는 비밀번호가 올바르지 않습니다.",
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
  INVALID004: {
    code: "INVALID004",
    status: 400,
    message: "일기 제목은 공백일 수 없습니다.",
  },
  INVALID005: {
    code: "INVALID005",
    status: 400,
    message: "일기 내용은 공백일 수 없습니다.",
  },
  INVALID006: {
    code: "INVALID006",
    status: 400,
    message: "사진 URL 형식이 올바르지 않습니다.",
  },
  INVALID007: {
    code: "INVALID007",
    status: 400,
    message: "UUID 형식이 올바르지 않습니다.",
  },
  INVALID008: {
    code: "INVALID008",
    status: 400,
    message: "비밀번호는 공백일 수 없습니다.",
  },
  INVALID009: {
    code: "INVALID009",
    status: 400,
    message: "수정할 필드가 없습니다.",
  },
  INVALID010: {
    code: "INVALID010",
    status: 400,
    message: "연도 또는 월 형식이 올바르지 않습니다.",
  },

  // 다이어리 관련
  DIARY001: {
    code: "DIARY001",
    status: 404,
    message: "삭제할 일기 사진을 찾을 수 없거나 접근 권한이 없습니다.",
  },
  DIARY002: {
    code: "DIARY002",
    status: 404,
    message: "조회할 일기를 찾을 수 없거나 접근 권한이 없습니다.",
  },

  // 사용자 관련
  USER001: {
    code: "USER001",
    status: 404,
    message: "사용자 정보를 찾을 수 없습니다.",
  },
} as const;
