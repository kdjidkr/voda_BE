export class HttpException extends Error {
  constructor(
    public status: number,        // HTTP 상태 코드 (404, 400 등)
    public message: string,       // 클라이언트에 전달할 메시지
    public errorCode?: string,    // 도메인 상세 코드 (ex: 'USER_NOT_FOUND')
    public details?: unknown      // 추가 디버깅 정보
  ) {
    super(message);
    this.name = this.constructor.name;
    // TypeScript에서 Error 상속 시 프로토타입 체인이 끊기는 현상 방지
    Object.setPrototypeOf(this, HttpException.prototype);
  }
}