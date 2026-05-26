export class AccessTokenResponseDto {
  accessToken!: string;
}

export class KakaoAuthCallbackResponseDto {
  needsSignup!: boolean;
  accessToken?: string;
  sessionToken?: string;
}
