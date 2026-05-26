export type ReportType = "WEEKLY" | "MONTHLY";

export interface CreateReportInput {
  userId: string;
  reportType: ReportType;
  baseDate: Date;
  summary: {
    text: string;
    photoCount: number;
    diaryCount: number;
  };
  detailsJson: {
    photos: string[];
    aiAnalysis: string;
    diaryIds: string[];
    [key: string]: any;
  };
}
