import { prisma } from "../../config/prisma";
import type { Prisma } from "../../generated/prisma/client";
import type { report_type } from "../../generated/prisma/enums";
import { CreateReportInput } from "./report.model";

type ReportModel = Prisma.reportGetPayload<Record<string, never>>;

class ReportRepository {
  async createReport(input: CreateReportInput): Promise<ReportModel> {
    return await prisma.report.create({
      data: {
        user_id: input.userId,
        report_type: input.reportType,
        base_date: input.baseDate,
        summary: input.summary,
        details_json: input.detailsJson,
      },
    });
  }

  async findReportById(
    userId: string,
    reportId: string,
  ): Promise<ReportModel | null> {
    return await prisma.report.findFirst({
      where: {
        report_id: reportId,
        user_id: userId,
      },
    });
  }

  async findReportsByUser(
    userId: string,
    reportType?: report_type,
  ): Promise<ReportModel[]> {
    return await prisma.report.findMany({
      where: {
        user_id: userId,
        ...(reportType && { report_type: reportType }),
      },
      orderBy: {
        base_date: "desc",
      },
    });
  }

  async findReportsByUserWithPagination(
    userId: string,
    limit: number,
    cursor?: string,
    reportType?: report_type,
  ): Promise<ReportModel[]> {
    return await prisma.report.findMany({
      where: {
        user_id: userId,
        ...(reportType && { report_type: reportType }),
      },
      orderBy: [
        { base_date: "desc" },
        { report_id: "desc" },
      ],
      ...(cursor
        ? {
            cursor: {
              report_id: cursor,
            },
            skip: 1,
          }
        : {}),
      take: limit + 1,
    });
  }

  async findReportByMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<ReportModel | null> {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0));

    return await prisma.report.findFirst({
      where: {
        user_id: userId,
        report_type: "MONTHLY",
        base_date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  async findReportByWeek(
    userId: string,
    weekStartDate: Date,
  ): Promise<ReportModel | null> {
    // 주의 시작일(월요일)과 끝일(일요일) 계산
    const weekEnd = new Date(weekStartDate);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

    return await prisma.report.findFirst({
      where: {
        user_id: userId,
        report_type: "WEEKLY",
        base_date: {
          gte: weekStartDate,
          lte: weekEnd,
        },
      },
    });
  }

  async deleteReport(userId: string, reportId: string): Promise<boolean> {
    const result = await prisma.report.deleteMany({
      where: {
        report_id: reportId,
        user_id: userId,
      },
    });

    return result.count > 0;
  }
}

export const reportRepository = new ReportRepository();
