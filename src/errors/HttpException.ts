type ErrorCodeObject = {
  readonly code: string;
  readonly status: number;
  readonly message: string;
};

export class HttpException extends Error {
  public status: number;
  public override message: string;
  public errorCode?: string;
  public details?: unknown;

  constructor(
    status: number,
    message: string,
    errorCode?: string,
    details?: unknown,
  );
  constructor(errorCodeObject: ErrorCodeObject, details?: unknown);
  constructor(
    statusOrErrorCodeObject: number | ErrorCodeObject,
    messageOrDetails?: string | unknown,
    errorCode?: string,
    details?: unknown,
  ) {
    if (typeof statusOrErrorCodeObject === "number") {
      const resolvedMessage =
        typeof messageOrDetails === "string"
          ? messageOrDetails
          : "Unknown error";
      super(resolvedMessage);
      this.status = statusOrErrorCodeObject;
      this.message = resolvedMessage;
      this.errorCode = errorCode;
      this.details = details;
    } else {
      super(statusOrErrorCodeObject.message);
      this.status = statusOrErrorCodeObject.status;
      this.message = statusOrErrorCodeObject.message;
      this.errorCode = statusOrErrorCodeObject.code;
      this.details = messageOrDetails;
    }

    this.name = this.constructor.name;
    // TypeScript에서 Error 상속 시 프로토타입 체인이 끊기는 현상 방지
    Object.setPrototypeOf(this, HttpException.prototype);
  }
}
