export interface CreateReportResponseDto {
  reportId: string;
  reportType: string;
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
  createdAt: Date;
}

export interface GetReportResponseDto {
  reportId: string;
  reportType: string;
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
  createdAt: Date;
}

export interface ReportListItemDto {
  reportId: string;
  baseDate: Date;
}

export interface GetReportListResponseDto {
  limit: number;
  count: number;
  nextCursor?: string;
  reports: ReportListItemDto[];
}
