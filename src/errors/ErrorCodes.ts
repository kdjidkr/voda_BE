export const ErrorCode = {
  // 인증 관련
  AUTH001: { code: 'AUTH001', status: 400, message: '회원가입 요청 형식이 올바르지 않습니다.' },
  AUTH002: { code: 'AUTH002', status: 409, message: '이미 존재하는 닉네임입니다.' },
  AUTH003: { code: 'AUTH003', status: 409, message: '이미 존재하는 이메일입니다.' },
  AUTH004: { code: 'AUTH004', status: 409, message: '이미 가입된 소셜 계정입니다.' },
  AUTH005: { code: 'AUTH005', status: 500, message: '서버 저장소 오류가 발생했습니다.' },

  // 유효성 관련
  INVALID001: { code: 'INVALID001', status: 400, message: '닉네임 형식이 올바르지 않습니다.' },
  INVALID002: { code: 'INVALID002', status: 400, message: '이메일 형식이 올바르지 않습니다.' },
  INVALID003: { code: 'INVALID003', status: 400, message: '비밀번호 형식이 올바르지 않습니다.' },
} as const;