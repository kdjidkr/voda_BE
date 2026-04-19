export class CreateTodoRequestDto {
	content!: string;
	/**
	 * ISO 8601 형식의 마감 기한 문자열입니다.
	 * Swagger 요청 예시를 참고해 주세요.
	 * 예: 2026-04-18T12:00:00.000Z
	 */
	dueTo?: string;
}
