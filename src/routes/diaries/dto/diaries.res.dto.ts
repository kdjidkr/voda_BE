export class DiaryPhotoResponseDto {
  photoId!: string;
  imageUrl!: string;
}

export class CreateBasicDiaryResponseDto {
  diaryId!: string;
  title!: string;
  content?: string;
  photos!: DiaryPhotoResponseDto[];
  inputType!: string;
  createdAt!: Date;
  inputId?: string;
}

export class MonthlyDiarySummaryItemDto {
  diaryId!: string;
  title!: string;
  createdAt!: Date;
}

export class MonthlyDiarySummaryDateGroupDto {
  date!: string;
  diaries!: MonthlyDiarySummaryItemDto[];
}

export class MonthlyDiarySummaryResponseDto {
  year!: number;
  month!: number;
  dates!: MonthlyDiarySummaryDateGroupDto[];
}

// 단일 키워드 응답 DTO
export class KeywordResponseDto {
  keywordId!: string;
  keyword!: string;
}
// 키워드 묶음 응답 DTO
export class CreateKeywordResponseDto {
  keywords!: KeywordResponseDto[];
}

export class PredictDiaryAiPredictionDataDto {
  status!: string;
  predicted_date!: string;
  predicted_diary!: string;
}

export class PredictDiaryAiPredictionDto {
  success!: boolean;
  data!: PredictDiaryAiPredictionDataDto;
}

export class PredictDiarySavedDiaryDto {
  diaryId!: string;
  title!: string;
  content!: string;
  diaryDate!: Date;
  inputType!: string;
  createdAt!: Date;
}

export class PredictDiaryResponseDto {
  prediction!: PredictDiaryAiPredictionDto;
  savedDiary!: PredictDiarySavedDiaryDto;
}
