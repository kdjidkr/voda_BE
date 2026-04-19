import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";
import { validateNonEmptyText, validateUuid } from "../utils/validators";
import { CreateRoutineRequestDto } from "./dto/routine.req.dto";
import {
  CreateRoutineResponseDto,
  GetRoutineListResponseDto,
  RoutineListItemDto,
  ToggleRoutineStatusResponseDto,
} from "./dto/routine.res.dto";
import {
  CreateRoutineInput,
  RoutineTabType,
  RoutineType,
} from "./routine.model";
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

  async getRoutines(
    userId: string,
    tab?: string,
  ): Promise<GetRoutineListResponseDto> {
    const normalizedTab = this.normalizeRoutineTab(tab);
    const routines =
      await routineRepository.findActiveRoutinesWithHistory(userId);
    const today = this.getTodayUtcDate();

    const routineItems = routines
      .map((routine) => {
        const cycle = this.calculateRoutineCycle(routine, today);

        if (normalizedTab === "incomplete" && cycle.state !== "incomplete") {
          return null;
        }

        if (normalizedTab === "scheduled" && cycle.state !== "scheduled") {
          return null;
        }

        if (normalizedTab === "completed" && cycle.state !== "completed") {
          return null;
        }

        return {
          routineId: routine.routine_id,
          content: routine.content,
          type: routine.type,
          daysOfWeek: routine.days_of_week,
          dayOfMonth: routine.day_of_month ?? undefined,
          scheduledFor: cycle.scheduledFor,
          completedAt: cycle.completedAt,
        } as RoutineListItemDto;
      })
      .filter((item): item is RoutineListItemDto => item !== null);

    return {
      tab: normalizedTab,
      count: routineItems.length,
      routines: routineItems,
    };
  }

  async toggleRoutineStatus(
    userId: string,
    routineId: string,
  ): Promise<ToggleRoutineStatusResponseDto> {
    const normalizedRoutineId = validateUuid(routineId, ErrorCode.INVALID007);
    const routine = await routineRepository.findActiveRoutineWithHistoryById(
      userId,
      normalizedRoutineId,
    );

    if (!routine) {
      throw new HttpException(ErrorCode.ROUTINE001);
    }

    const today = this.getTodayUtcDate();

    if (!this.canToggleToday(routine, today)) {
      throw new HttpException(ErrorCode.INVALID022);
    }

    const currentCompletion = this.findCompletionInCurrentCycle(routine, today);

    if (currentCompletion) {
      await routineRepository.deleteRoutineHistoryByDate(
        normalizedRoutineId,
        currentCompletion,
      );

      return {
        routineId: normalizedRoutineId,
        completed: false,
        completedAt: undefined,
      };
    }

    await routineRepository.createRoutineHistory(normalizedRoutineId, today);

    return {
      routineId: normalizedRoutineId,
      completed: true,
      completedAt: today,
    };
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

  private normalizeRoutineTab(tab?: string): RoutineTabType {
    const normalizedTab = tab?.trim().toLowerCase() ?? "incomplete";

    if (
      normalizedTab !== "incomplete" &&
      normalizedTab !== "scheduled" &&
      normalizedTab !== "completed"
    ) {
      throw new HttpException(ErrorCode.INVALID021, { tab });
    }

    return normalizedTab;
  }

  private canToggleToday(
    routine: {
      type: string;
      days_of_week: number[];
      day_of_month: number | null;
    },
    today: Date,
  ): boolean {
    if (routine.type === "DAILY") {
      return true;
    }

    if (routine.type === "WEEKLY") {
      if (routine.days_of_week.length === 0) {
        return true;
      }

      return routine.days_of_week.includes(this.getIsoWeekday(today));
    }

    if (!routine.day_of_month) {
      return true;
    }

    const daysInMonth = this.getDaysInMonth(today);

    if (routine.day_of_month > daysInMonth) {
      return false;
    }

    return today.getUTCDate() === routine.day_of_month;
  }

  private findCompletionInCurrentCycle(
    routine: {
      type: string;
      history: { completed_at: Date }[];
    },
    today: Date,
  ): Date | undefined {
    if (routine.type === "DAILY") {
      return this.findCompletionOnDate(routine.history, today);
    }

    if (routine.type === "WEEKLY") {
      const weekRange = this.getWeekRange(today);
      return this.findCompletionInRange(
        routine.history,
        weekRange.start,
        weekRange.end,
      );
    }

    const monthRange = this.getMonthRange(today);

    return this.findCompletionInRange(
      routine.history,
      monthRange.start,
      monthRange.end,
    );
  }

  private calculateRoutineCycle(
    routine: {
      type: string;
      days_of_week: number[];
      day_of_month: number | null;
      history: { completed_at: Date }[];
    },
    today: Date,
  ):
    | {
        state: "incomplete";
        scheduledFor?: Date;
        completedAt?: Date;
      }
    | {
        state: "scheduled";
        scheduledFor: Date;
        completedAt?: Date;
      }
    | {
        state: "completed";
        scheduledFor?: Date;
        completedAt: Date;
      }
    | {
        state: "hidden";
        scheduledFor?: Date;
        completedAt?: Date;
      } {
    if (routine.type === "DAILY") {
      const completedAt = this.findCompletionOnDate(routine.history, today);

      if (completedAt) {
        return { state: "completed", completedAt };
      }

      return { state: "incomplete" };
    }

    if (routine.type === "WEEKLY") {
      const weekRange = this.getWeekRange(today);
      const completedAt = this.findCompletionInRange(
        routine.history,
        weekRange.start,
        weekRange.end,
      );

      if (completedAt) {
        return { state: "completed", completedAt };
      }

      if (routine.days_of_week.length === 0) {
        return { state: "incomplete" };
      }

      const todayIsoWeekday = this.getIsoWeekday(today);

      if (routine.days_of_week.includes(todayIsoWeekday)) {
        return { state: "incomplete" };
      }

      const nextWeekday = routine.days_of_week
        .filter((day) => day > todayIsoWeekday)
        .sort((a, b) => a - b)[0];

      if (!nextWeekday) {
        return { state: "hidden" };
      }

      const scheduledFor = this.addDays(today, nextWeekday - todayIsoWeekday);

      return { state: "scheduled", scheduledFor };
    }

    const monthRange = this.getMonthRange(today);
    const completedAt = this.findCompletionInRange(
      routine.history,
      monthRange.start,
      monthRange.end,
    );

    if (completedAt) {
      return { state: "completed", completedAt };
    }

    if (!routine.day_of_month) {
      return { state: "incomplete" };
    }

    const dayOfMonth = routine.day_of_month;
    const daysInMonth = this.getDaysInMonth(today);

    if (dayOfMonth > daysInMonth) {
      return { state: "hidden" };
    }

    const todayDate = today.getUTCDate();

    if (todayDate === dayOfMonth) {
      return { state: "incomplete" };
    }

    if (todayDate < dayOfMonth) {
      const scheduledFor = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), dayOfMonth),
      );

      return { state: "scheduled", scheduledFor };
    }

    return { state: "hidden" };
  }

  private findCompletionOnDate(
    history: { completed_at: Date }[],
    date: Date,
  ): Date | undefined {
    const dateKey = this.toDateKey(date);

    return history.find((item) => this.toDateKey(item.completed_at) === dateKey)
      ?.completed_at;
  }

  private findCompletionInRange(
    history: { completed_at: Date }[],
    start: Date,
    end: Date,
  ): Date | undefined {
    return history.find((item) => {
      const key = this.toDateKey(item.completed_at);
      return key >= this.toDateKey(start) && key <= this.toDateKey(end);
    })?.completed_at;
  }

  private getTodayUtcDate(): Date {
    const now = new Date();
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
  }

  private getIsoWeekday(date: Date): number {
    const day = date.getUTCDay();
    return day === 0 ? 7 : day;
  }

  private getWeekRange(date: Date): { start: Date; end: Date } {
    const isoWeekday = this.getIsoWeekday(date);
    const start = this.addDays(date, -(isoWeekday - 1));
    const end = this.addDays(start, 6);

    return { start, end };
  }

  private getMonthRange(date: Date): { start: Date; end: Date } {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0));

    return { start, end };
  }

  private getDaysInMonth(date: Date): number {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
    ).getUTCDate();
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
  }

  private toDateKey(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
}

export const routineService = new RoutineService();
