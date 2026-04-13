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
