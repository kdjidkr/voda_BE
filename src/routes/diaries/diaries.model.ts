import { CreateBasicDiaryRequestDto } from "./dto/diaries.req.dto";

export interface BasicDiaryInput extends CreateBasicDiaryRequestDto {
  userId: string;
}
