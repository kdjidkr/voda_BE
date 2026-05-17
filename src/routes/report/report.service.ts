import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";
import { validateNonEmptyText, validateUuid } from "../utils/validators";
import { CreateReportRequestDto } from "./dto/report.req.dto";
import {
  CreateReportResponseDto,
  GetReportListResponseDto,
  GetReportResponseDto,
} from "./dto/report.res.dto";
import { CreateReportInput, ReportType } from "./report.model";
import { reportRepository } from "./report.repository";
import { kstDayjs } from "../../utils/date";

class ReportService {
  private static readonly DEFAULT_REPORT_PAGE_SIZE = 20;
  private static readonly MAX_REPORT_PAGE_SIZE = 100;
  async createReport(
    userId: string,
    requestBody: CreateReportRequestDto,
  ): Promise<CreateReportResponseDto> {
    // baseDate 파싱 및 검증
    const baseDate = this.parseAndValidateDate(requestBody.baseDate);

    // summary 검증
    if (!requestBody.summary || typeof requestBody.summary !== "object") {
      throw new HttpException(ErrorCode.INVALID001);
    }

    const summaryText = validateNonEmptyText(
      requestBody.summary.text,
      ErrorCode.INVALID001,
    );

    if (
      !Number.isInteger(requestBody.summary.photoCount) ||
      requestBody.summary.photoCount < 0
    ) {
      throw new HttpException(ErrorCode.INVALID001);
    }

    if (
      !Number.isInteger(requestBody.summary.diaryCount) ||
      requestBody.summary.diaryCount < 0
    ) {
      throw new HttpException(ErrorCode.INVALID001);
    }

    // detailsJson 검증
    if (!requestBody.detailsJson || typeof requestBody.detailsJson !== "object") {
      throw new HttpException(ErrorCode.INVALID001);
    }

    if (!Array.isArray(requestBody.detailsJson.photos)) {
      throw new HttpException(ErrorCode.INVALID001);
    }

    if (!Array.isArray(requestBody.detailsJson.diaryIds)) {
      throw new HttpException(ErrorCode.INVALID001);
    }

    // 기존 같은 월의 레포트가 있는지 확인
    const existingReport = await reportRepository.findReportByMonth(
      userId,
      kstDayjs(baseDate).year(),
      kstDayjs(baseDate).month() + 1,
    );

    if (existingReport) {
      throw new HttpException(ErrorCode.REPORT002);
    }

    const createReportInput: CreateReportInput = {
      userId,
      reportType: "MONTHLY",
      baseDate,
      summary: {
        text: summaryText,
        photoCount: requestBody.summary.photoCount,
        diaryCount: requestBody.summary.diaryCount,
      },
      detailsJson: {
        ...requestBody.detailsJson,
        aiAnalysis: requestBody.detailsJson.aiAnalysis || "",
      },
    };

    const result = await reportRepository.createReport(createReportInput);

    return this.mapToResponseDto(result);
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
      baseDate: report.base_date,
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
      Number.isNaN(parsed) || parsed < 1 || parsed > ReportService.MAX_REPORT_PAGE_SIZE;

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

    const report = await reportRepository.findReportByMonth(userId, year, month);

    if (!report) {
      throw new HttpException(ErrorCode.REPORT001);
    }

    return this.mapToResponseDto(report);
  }

  async deleteReport(userId: string, reportId: string): Promise<void> {
    const normalizedReportId = validateUuid(reportId, ErrorCode.INVALID007);
    const report = await reportRepository.findReportById(userId, normalizedReportId);

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

  async createWeeklyReport(
    userId: string,
    requestBody: CreateReportRequestDto,
  ): Promise<CreateReportResponseDto> {
    // baseDate 파싱 및 검증 (Monday를 기준으로)
    const baseDate = this.parseAndValidateDateForWeekly(requestBody.baseDate);

    // summary 검증
    if (!requestBody.summary || typeof requestBody.summary !== "object") {
      throw new HttpException(ErrorCode.INVALID001);
    }

    const summaryText = validateNonEmptyText(
      requestBody.summary.text,
      ErrorCode.INVALID001,
    );

    if (
      !Number.isInteger(requestBody.summary.photoCount) ||
      requestBody.summary.photoCount < 0
    ) {
      throw new HttpException(ErrorCode.INVALID001);
    }

    if (
      !Number.isInteger(requestBody.summary.diaryCount) ||
      requestBody.summary.diaryCount < 0
    ) {
      throw new HttpException(ErrorCode.INVALID001);
    }

    // detailsJson 검증 (weeklyBreakdown 포함)
    if (!requestBody.detailsJson || typeof requestBody.detailsJson !== "object") {
      throw new HttpException(ErrorCode.INVALID001);
    }

    if (!Array.isArray(requestBody.detailsJson.photos)) {
      throw new HttpException(ErrorCode.INVALID001);
    }

    if (!Array.isArray(requestBody.detailsJson.diaryIds)) {
      throw new HttpException(ErrorCode.INVALID001);
    }

    // weeklyBreakdown 검증
    if (!Array.isArray(requestBody.detailsJson.weeklyBreakdown)) {
      throw new HttpException(ErrorCode.INVALID001);
    }

    this.validateWeeklyBreakdown(requestBody.detailsJson.weeklyBreakdown);

    // 기존 같은 주의 레포트가 있는지 확인
    const existingReport = await reportRepository.findReportByWeek(
      userId,
      baseDate,
    );

    if (existingReport) {
      throw new HttpException(ErrorCode.REPORT002);
    }

    const createReportInput: CreateReportInput = {
      userId,
      reportType: "WEEKLY",
      baseDate,
      summary: {
        text: summaryText,
        photoCount: requestBody.summary.photoCount,
        diaryCount: requestBody.summary.diaryCount,
      },
      detailsJson: {
        ...requestBody.detailsJson,
        aiAnalysis: requestBody.detailsJson.aiAnalysis || "",
      },
    };

    const result = await reportRepository.createReport(createReportInput);

    return this.mapToResponseDto(result);
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
    const report = await reportRepository.findReportById(userId, normalizedReportId);

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
      baseDate: report.base_date,
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

  private validateWeeklyBreakdown(weeklyBreakdown: any[]): void {
    if (weeklyBreakdown.length === 0) {
      throw new HttpException(ErrorCode.INVALID001);
    }

    for (const dayRecord of weeklyBreakdown) {
      if (!dayRecord || typeof dayRecord !== "object") {
        throw new HttpException(ErrorCode.INVALID001);
      }

      // date 검증 (YYYY-MM-DD 형식)
      if (!dayRecord.date || typeof dayRecord.date !== "string") {
        throw new HttpException(ErrorCode.INVALID001);
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dayRecord.date)) {
        throw new HttpException(ErrorCode.INVALID001);
      }

      // dayOfWeek 검증
      const validDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      if (!dayRecord.dayOfWeek || !validDays.includes(dayRecord.dayOfWeek)) {
        throw new HttpException(ErrorCode.INVALID001);
      }

      // dailyAnalysis 검증
      validateNonEmptyText(
        dayRecord.dailyAnalysis,
        ErrorCode.INVALID001,
      );

      // photos 검증
      if (!Array.isArray(dayRecord.photos)) {
        throw new HttpException(ErrorCode.INVALID001);
      }

      // diaryId 검증 (optional but if provided must be valid UUID)
      if (dayRecord.diaryId !== undefined && dayRecord.diaryId !== null) {
        if (typeof dayRecord.diaryId !== "string") {
          throw new HttpException(ErrorCode.INVALID001);
        }
        validateUuid(dayRecord.diaryId, ErrorCode.INVALID001);
      }
    }
  }

  private parseAndValidateDate(dateString: string): Date {
    const date = kstDayjs(dateString);

    if (!date.isValid()) {
      throw new HttpException(ErrorCode.INVALID001);
    }

    // 날짜를 KST로 변환 (해당 월의 1일)
    return date.startOf("month").toDate();
  }

  private parseAndValidateDateForWeekly(dateString: string): Date {
    const date = kstDayjs(dateString);

    if (!date.isValid()) {
      throw new HttpException(ErrorCode.INVALID001);
    }

    // 월요일을 기준으로 주의 시작일 계산
    // dayjs().startOf('week')는 일요일이므로, isoWeek()를 쓰거나 명시적으로 계산
    let startOfWeek = date.startOf("week");
    if (date.day() === 0) {
      // 일요일인 경우 저번주 월요일로
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
      baseDate: report.base_date,
      summary: report.summary,
      detailsJson: report.details_json,
      createdAt: report.created_at,
    };
  }
}

export const reportService = new ReportService();
