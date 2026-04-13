export class CreateBasicDiaryRequestDto {
  title!: string;
  content?: string;
  photos?: string[];
}

export class UpdateBasicDiaryRequestDto {
  title?: string;
  content?: string;
}
