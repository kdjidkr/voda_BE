import { CreateBasicDiaryRequestDto } from "./dto/diaries.req.dto";

export interface BasicDiaryInput extends CreateBasicDiaryRequestDto {
  userId: string;
}

export interface UpdateBasicDiaryInput {
  title?: string;
  content?: string;
}

export interface MonthlyDiarySummaryInput {
  diary_id: string;
  title: string | null;
  created_at: Date;
  diary_date: Date;
}
