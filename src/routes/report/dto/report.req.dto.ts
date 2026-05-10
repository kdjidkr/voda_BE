export interface CreateReportRequestDto {
  /**
   * 기준 날짜 (YYYY-MM-DD)
   * @example "2025-09-01"
   */
  baseDate: string;

  /**
   * 레포트 요약
   */
  summary: {
    /**
     * AI가 생성한 레포트 텍스트
     * @example "(닉네임)의 한 달 분석 텍스트..."
     */
    text: string;

    /**
     * 포함된 사진 개수
     */
    photoCount: number;

    /**
     * 포함된 일기 개수
     */
    diaryCount: number;
  };

  /**
   * 레포트 상세 정보
   */
  detailsJson: {
    /**
     * 선별된 사진 URL 배열
     */
    photos: string[];

    /**
     * AI 분석 텍스트
     */
    aiAnalysis: string;

    /**
     * 포함된 일기 ID 배열
     */
    diaryIds: string[];

    /**
     * 추가 분석 데이터
     */
    [key: string]: any;
  };
}
