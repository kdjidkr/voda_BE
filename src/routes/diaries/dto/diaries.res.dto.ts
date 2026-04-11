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
