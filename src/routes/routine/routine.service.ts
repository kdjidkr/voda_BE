import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";
import { validateNonEmptyText, validateUuid } from "../utils/validators";
import { CreateRoutineRequestDto } from "./dto/routine.req.dto";
import { CreateRoutineResponseDto } from "./dto/routine.res.dto";
import { CreateRoutineInput, RoutineType } from "./routine.model";
import { routineRepository } from "./routine.repository";

class RoutineService {
  async createRoutine(
    userId: string,
    requestBody: CreateRoutineRequestDto,
  ): Promise<CreateRoutineResponseDto> {
    const content = validateNonEmptyText(
      requestBody.content,
      ErrorCode.INVALID015,
    );
    const type = this.normalizeRoutineType(requestBody.type);
    const daysOfWeek = this.normalizeDaysOfWeek(requestBody.daysOfWeek);
    const dayOfMonth = this.normalizeDayOfMonth(requestBody.dayOfMonth);

    const createRoutineInput = this.buildCreateRoutineInput({
      userId,
      content,
      type,
      daysOfWeek,
      dayOfMonth,
    });

    const result = await routineRepository.createRoutine(createRoutineInput);

    return {
      routineId: result.routine_id,
      content: result.content,
      type: result.type,
      daysOfWeek: result.days_of_week,
      dayOfMonth: result.day_of_month ?? undefined,
      createdAt: result.created_at,
    };
  }

  async deleteRoutine(userId: string, routineId: string): Promise<void> {
    const normalizedRoutineId = validateUuid(routineId, ErrorCode.INVALID007);
    const isDeleted = await routineRepository.softDeleteRoutine(
      userId,
      normalizedRoutineId,
    );

    if (!isDeleted) {
      throw new HttpException(ErrorCode.ROUTINE001);
    }
  }

  private normalizeRoutineType(type: string): RoutineType {
    const normalizedType = type?.trim().toUpperCase();

    if (
      normalizedType !== "DAILY" &&
      normalizedType !== "WEEKLY" &&
      normalizedType !== "MONTHLY"
    ) {
      throw new HttpException(ErrorCode.INVALID016, { type });
    }

    return normalizedType;
  }

  private normalizeDaysOfWeek(daysOfWeek?: number[]): number[] {
    if (!daysOfWeek) {
      return [];
    }

    const normalized = [...new Set(daysOfWeek)].sort((a, b) => a - b);
    const hasInvalidDay = normalized.some(
      (day) => !Number.isInteger(day) || day < 1 || day > 7,
    );

    if (hasInvalidDay) {
      throw new HttpException(ErrorCode.INVALID017, { daysOfWeek });
    }

    return normalized;
  }

  private normalizeDayOfMonth(dayOfMonth?: number): number | undefined {
    if (dayOfMonth === undefined || dayOfMonth === null) {
      return undefined;
    }

    const isInvalid =
      !Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31;

    if (isInvalid) {
      throw new HttpException(ErrorCode.INVALID019, { dayOfMonth });
    }

    return dayOfMonth;
  }

  private buildCreateRoutineInput(input: {
    userId: string;
    content: string;
    type: RoutineType;
    daysOfWeek: number[];
    dayOfMonth?: number;
  }): CreateRoutineInput {
    if (input.type === "DAILY") {
      if (input.daysOfWeek.length > 0 || input.dayOfMonth !== undefined) {
        throw new HttpException(ErrorCode.INVALID020);
      }

      return {
        userId: input.userId,
        content: input.content,
        type: input.type,
        daysOfWeek: [],
      };
    }

    if (input.type === "WEEKLY") {
      if (input.dayOfMonth !== undefined) {
        throw new HttpException(ErrorCode.INVALID020);
      }

      return {
        userId: input.userId,
        content: input.content,
        type: input.type,
        daysOfWeek: input.daysOfWeek,
      };
    }

    if (input.daysOfWeek.length > 0) {
      throw new HttpException(ErrorCode.INVALID020);
    }

    return {
      userId: input.userId,
      content: input.content,
      type: input.type,
      daysOfWeek: [],
      dayOfMonth: input.dayOfMonth,
    };
  }
}

export const routineService = new RoutineService();
