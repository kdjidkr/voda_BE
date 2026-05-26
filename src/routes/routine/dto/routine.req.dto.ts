export class CreateRoutineRequestDto {
  /**
   * 루틴 내용
   */
  content!: string;

  /**
   * 루틴 타입 문자열
   * 허용값: DAILY | WEEKLY | MONTHLY
   */
  type!: string;

  /**
   * 주간 루틴 요일 배열
   * 허용값: 1(월)~7(일)
   * WEEKLY에서 비우면 "주에 최소 1회" 의미입니다.
   */
  daysOfWeek?: number[];

  /**
   * 월간 루틴 날짜
   * 허용값: 1~31
   * MONTHLY에서 생략하면 "월에 최소 1회" 의미입니다.
   */
  dayOfMonth?: number;
}
