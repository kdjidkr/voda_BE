import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";
import { formatKstDate, kstDayjs } from "../../utils/date";
import { diariesRepository } from "../diaries/diaries.repository";
import { usersRepository } from "../users/users.repository";
import { validateUuid } from "../utils/validators";
import { GenerateReportRequestDto } from "./dto/report.req.dto";
import {
  CreateReportResponseDto,
  GetReportListResponseDto,
  GetReportResponseDto,
} from "./dto/report.res.dto";
import { CreateReportInput } from "./report.model";
import { reportRepository } from "./report.repository";

const AI_API_URL = process.env.AI_API_URL;

class ReportService {
  private static readonly DEFAULT_REPORT_PAGE_SIZE = 20;
  private static readonly MAX_REPORT_PAGE_SIZE = 100;

  async generateMonthlyReport(
    userId: string,
    requestBody: GenerateReportRequestDto,
  ): Promise<CreateReportResponseDto> {
    if (!AI_API_URL) {
      throw new HttpException(ErrorCode.REPORT004);
    }
    const baseDate = this.parseAndValidateDate(requestBody.baseDate);
    const targetYear = kstDayjs(baseDate).year();
    const targetMonth = kstDayjs(baseDate).month() + 1;

    const existingReport = await reportRepository.findReportByMonth(
      userId,
      targetYear,
      targetMonth,
    );
    if (existingReport) {
      throw new HttpException(ErrorCode.REPORT002);
    }

    const userProfile = await usersRepository.findUserMeBaseProfile(userId);
    if (!userProfile) {
      throw new HttpException(ErrorCode.AUTH008); 
    }
    const age = kstDayjs().diff(kstDayjs(userProfile.birth_date), "year");

    const startDate = kstDayjs(baseDate).startOf("month").toDate();
    const endDate = kstDayjs(baseDate).endOf("month").toDate();

    const diaries = await diariesRepository.findDiariesByDateRange(userId, startDate, endDate);
    const diaryCount = diaries.length;
    const photoCount = diaries.reduce((acc, cur) => acc + cur.diary_photo.length, 0);

    let previousReportData = {
      diaryCount: 0,
      overallSentiment: "",
      topTheme: "",
    };
    if (targetMonth === 1) {
      const prev = await reportRepository.findReportByMonth(userId, targetYear - 1, 12);
      if (prev) {
        previousReportData = {
          diaryCount: (prev.summary as any)?.diaryCount || 0,
          overallSentiment: (prev.details_json as any)?.overallSentiment || "",
          topTheme: (prev.details_json as any)?.topTheme || "",
        };
      }
    } else {
      const prev = await reportRepository.findReportByMonth(userId, targetYear, targetMonth - 1);
      if (prev) {
        previousReportData = {
          diaryCount: (prev.summary as any)?.diaryCount || 0,
          overallSentiment: (prev.details_json as any)?.overallSentiment || "",
          topTheme: (prev.details_json as any)?.topTheme || "",
        };
      }
    }

    const dayOfWeekMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const diaryList = diaries.map((d) => ({
      diaryId: d.diary_id,
      date: kstDayjs(d.diary_date).format("YYYY-MM-DD"),
      dayOfWeek: dayOfWeekMap[kstDayjs(d.diary_date).day()],
      title: d.title,
      content: d.content,
    }));

    const aiPayload = {
      reportType: "MONTHLY",
      baseDate: kstDayjs(baseDate).format("YYYY-MM-DD"),
      userInfo: {
        nickname: userProfile.nickname,
        gender: userProfile.gender || "UNKNOWN",
        age,
      },
      stats: {
        diaryCount,
        photoCount,
      },
      previousReport: previousReportData,
      diaries: diaryList,
    };

    const aiResponse = await this.callAiBackend(aiPayload);
    if (!aiResponse?.success || !aiResponse?.data) {
       throw new HttpException(ErrorCode.REPORT003);
    }

    const photos = diaries.flatMap((d) => d.diary_photo.map((p) => p.image_url)).slice(0, 5);
    const diaryIds = diaries.map((d) => d.diary_id);

    const createReportInput: CreateReportInput = {
      userId,
      reportType: "MONTHLY",
      baseDate,
      summary: {
        text: `이번 달은 ${diaryCount}개의 일기를 작성했어요`,
        photoCount,
        diaryCount,
      },
      detailsJson: {
        photos,
        topTheme: aiResponse.data.topTheme,
        overallSentiment: aiResponse.data.overallSentiment,
        weeklyEvents: aiResponse.data.weeklyEvents,
        aiAnalysis: aiResponse.data.aiAnalysis,
        diaryIds,
      },
    };

    const result = await reportRepository.createReport(createReportInput);
    return this.mapToResponseDto(result);
  }

  async generateWeeklyReport(
    userId: string,
    requestBody: GenerateReportRequestDto,
  ): Promise<CreateReportResponseDto> {
    if (!AI_API_URL) {
      throw new HttpException(ErrorCode.REPORT004);
    }
    const baseDate = this.parseAndValidateDateForWeekly(requestBody.baseDate);

    const existingReport = await reportRepository.findReportByWeek(userId, baseDate);
    if (existingReport) {
      throw new HttpException(ErrorCode.REPORT002);
    }

    const userProfile = await usersRepository.findUserMeBaseProfile(userId);
    if (!userProfile) {
      throw new HttpException(ErrorCode.AUTH008); 
    }
    const age = kstDayjs().diff(kstDayjs(userProfile.birth_date), "year");

    const endDate = kstDayjs(baseDate).add(6, "day").endOf("day").toDate();

    const diaries = await diariesRepository.findDiariesByDateRange(userId, baseDate, endDate);
    const diaryCount = diaries.length;
    const photoCount = diaries.reduce((acc, cur) => acc + cur.diary_photo.length, 0);

    const prevWeekStart = kstDayjs(baseDate).subtract(7, "day").toDate();
    const prev = await reportRepository.findReportByWeek(userId, prevWeekStart);
    let previousReportData = {
      diaryCount: 0,
      overallSentiment: "",
    };
    if (prev) {
      previousReportData = {
        diaryCount: (prev.summary as any)?.diaryCount || 0,
        overallSentiment: (prev.details_json as any)?.overallSentiment || "", 
      };
    }

    const dayOfWeekMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const diaryList = diaries.map((d) => ({
      diaryId: d.diary_id,
      date: kstDayjs(d.diary_date).format("YYYY-MM-DD"),
      dayOfWeek: dayOfWeekMap[kstDayjs(d.diary_date).day()],
      title: d.title,
      content: d.content,
    }));

    const aiPayload = {
      reportType: "WEEKLY",
      baseDate: kstDayjs(baseDate).format("YYYY-MM-DD"),
      userInfo: {
        nickname: userProfile.nickname,
        gender: userProfile.gender || "UNKNOWN",
        age,
      },
      stats: {
        diaryCount,
        photoCount,
      },
      previousReport: previousReportData,
      diaries: diaryList,
    };

    const aiResponse = await this.callAiBackend(aiPayload);
    if (!aiResponse?.success || !aiResponse?.data) {
       throw new HttpException(ErrorCode.REPORT003);
    }

    const breakdownMap = new Map<string, any>();
    
    for (const aiDaily of (aiResponse.data.dailyAnalysisList || [])) {
      const targetIds = aiDaily.diaryId
        ? aiDaily.diaryId
            .split(",")
            .map((id: string) => id.trim())
            .filter(Boolean)
        : [];
      const matchedDiaries = diaries.filter((d) => targetIds.includes(d.diary_id));
      const photos = matchedDiaries.flatMap((d) => d.diary_photo.map((p) => p.image_url));

      if (!breakdownMap.has(aiDaily.date)) {
        breakdownMap.set(aiDaily.date, {
          date: aiDaily.date,
          dayOfWeek: aiDaily.dayOfWeek,
          dailyAnalysis: aiDaily.analysis,
          photos: [...photos],
          diaryId: targetIds[0] || "",
        });
      } else {
        const existing = breakdownMap.get(aiDaily.date);
        existing.dailyAnalysis += `\n\n${aiDaily.analysis}`;
        existing.photos.push(...photos);
      }
    }

    const weeklyBreakdown = Array.from(breakdownMap.values())
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((item: any) => ({
        date: item.date,
        dayOfWeek: item.dayOfWeek,
        dailyAnalysis: item.dailyAnalysis,
        photos: Array.from(new Set(item.photos)),
        diaryId: item.diaryId,
      }));

    const photos = diaries.flatMap((d) => d.diary_photo.map((p) => p.image_url)).slice(0, 5);
    const diaryIds = diaries.map((d) => d.diary_id);

    const createReportInput: CreateReportInput = {
      userId,
      reportType: "WEEKLY",
      baseDate,
      summary: {
        text: `이번 주는 ${diaryCount}개의 일기를 작성했어요`,
        photoCount,
        diaryCount,
      },
      detailsJson: {
        photos,
        weeklyBreakdown,
        diaryIds,
      },
    };

    const result = await reportRepository.createReport(createReportInput);
    return this.mapToResponseDto(result);
  }

  private async callAiBackend(payload: any): Promise<any> {
    if (!AI_API_URL) {
      throw new HttpException(ErrorCode.REPORT004);
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(AI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        console.error("AI API Error:", await response.text());
        return { success: false };
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      console.error("AI API Request Failed:", error);
      return { success: false };
    }
  }

  async getReport(
    userId: string,
    reportId: string,
  ): Promise<GetReportResponseDto> {
    const normalizedReportId = validateUuid(reportId, ErrorCode.INVALID007);
    const report = await reportRepository.findReportById(
      userId,
      normalizedReportId,
    );

    if (!report || report.report_type !== "MONTHLY") {
      throw new HttpException(ErrorCode.REPORT001);
    }

    return this.mapToResponseDto(report);
  }

  async getReports(
    userId: string,
    limit?: string,
    cursor?: string,
  ): Promise<GetReportListResponseDto> {
    const pageSize = this.normalizePageSize(limit);
    const normalizedCursor = this.normalizeCursor(cursor);

    const reports = await reportRepository.findReportsByUserWithPagination(
      userId,
      pageSize,
      normalizedCursor,
      "MONTHLY",
    );

    const hasNextPage = reports.length > pageSize;
    const pageReports = hasNextPage ? reports.slice(0, pageSize) : reports;

    const reportItems = pageReports.map((report) => ({
      reportId: report.report_id,
      baseDate: formatKstDate(report.base_date),
    }));

    const nextCursor = hasNextPage
      ? pageReports[pageReports.length - 1]?.report_id
      : undefined;

    return {
      limit: pageSize,
      count: reportItems.length,
      nextCursor,
      reports: reportItems,
    };
  }

  private normalizePageSize(limit?: string): number {
    if (!limit || limit.trim().length === 0) {
      return ReportService.DEFAULT_REPORT_PAGE_SIZE;
    }

    const parsed = Number.parseInt(limit, 10);
    const isInvalid =
      Number.isNaN(parsed) ||
      parsed < 1 ||
      parsed > ReportService.MAX_REPORT_PAGE_SIZE;

    if (isInvalid) {
      throw new HttpException(ErrorCode.INVALID100, { limit });
    }

    return parsed;
  }

  private normalizeCursor(cursor?: string): string | undefined {
    if (!cursor || cursor.trim().length === 0) {
      return undefined;
    }

    return validateUuid(cursor, ErrorCode.INVALID007);
  }

  async getReportByMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<GetReportResponseDto> {
    if (!Number.isInteger(year) || !Number.isInteger(month)) {
      throw new HttpException(ErrorCode.INVALID010);
    }

    if (month < 1 || month > 12) {
      throw new HttpException(ErrorCode.INVALID010);
    }

    const report = await reportRepository.findReportByMonth(
      userId,
      year,
      month,
    );

    if (!report) {
      throw new HttpException(ErrorCode.REPORT001);
    }

    return this.mapToResponseDto(report);
  }

  async deleteReport(userId: string, reportId: string): Promise<void> {
    const normalizedReportId = validateUuid(reportId, ErrorCode.INVALID007);
    const report = await reportRepository.findReportById(
      userId,
      normalizedReportId,
    );

    if (!report || report.report_type !== "MONTHLY") {
      throw new HttpException(ErrorCode.REPORT001);
    }

    const isDeleted = await reportRepository.deleteReport(
      userId,
      normalizedReportId,
    );

    if (!isDeleted) {
      throw new HttpException(ErrorCode.REPORT001);
    }
  }

  async getWeeklyReport(
    userId: string,
    reportId: string,
  ): Promise<GetReportResponseDto> {
    const normalizedReportId = validateUuid(reportId, ErrorCode.INVALID007);
    const report = await reportRepository.findReportById(
      userId,
      normalizedReportId,
    );

    if (!report || report.report_type !== "WEEKLY") {
      throw new HttpException(ErrorCode.REPORT001);
    }

    return this.mapToResponseDto(report);
  }

  async deleteWeeklyReport(userId: string, reportId: string): Promise<void> {
    const normalizedReportId = validateUuid(reportId, ErrorCode.INVALID007);
    const report = await reportRepository.findReportById(
      userId,
      normalizedReportId,
    );

    if (!report || report.report_type !== "WEEKLY") {
      throw new HttpException(ErrorCode.REPORT001);
    }

    const isDeleted = await reportRepository.deleteReport(
      userId,
      normalizedReportId,
    );

    if (!isDeleted) {
      throw new HttpException(ErrorCode.REPORT001);
    }
  }

  async getWeeklyReports(
    userId: string,
    limit?: string,
    cursor?: string,
  ): Promise<GetReportListResponseDto> {
    const pageSize = this.normalizePageSize(limit);
    const normalizedCursor = this.normalizeCursor(cursor);

    const reports = await reportRepository.findReportsByUserWithPagination(
      userId,
      pageSize,
      normalizedCursor,
      "WEEKLY",
    );

    const hasNextPage = reports.length > pageSize;
    const pageReports = hasNextPage ? reports.slice(0, pageSize) : reports;

    const reportItems = pageReports.map((report) => ({
      reportId: report.report_id,
      baseDate: formatKstDate(report.base_date),
    }));

    const nextCursor = hasNextPage
      ? pageReports[pageReports.length - 1]?.report_id
      : undefined;

    return {
      limit: pageSize,
      count: reportItems.length,
      nextCursor,
      reports: reportItems,
    };
  }

  private parseAndValidateDate(dateString: string): Date {
    const date = kstDayjs(dateString);

    if (!date.isValid()) {
      throw new HttpException(ErrorCode.INVALID001);
    }

    return date.startOf("month").toDate();
  }

  private parseAndValidateDateForWeekly(dateString: string): Date {
    const date = kstDayjs(dateString);

    if (!date.isValid()) {
      throw new HttpException(ErrorCode.INVALID001);
    }

    let startOfWeek = date.startOf("week");
    if (date.day() === 0) {
      startOfWeek = startOfWeek.subtract(6, "day");
    } else {
      startOfWeek = startOfWeek.add(1, "day");
    }

    return startOfWeek.startOf("day").toDate();
  }

  private mapToResponseDto(
    report: any,
  ): CreateReportResponseDto | GetReportResponseDto {
    return {
      reportId: report.report_id,
      reportType: report.report_type,
      baseDate: formatKstDate(report.base_date),
      summary: report.summary,
      detailsJson: report.details_json,
      createdAt: report.created_at,
    };
  }
}

export const reportService = new ReportService();
