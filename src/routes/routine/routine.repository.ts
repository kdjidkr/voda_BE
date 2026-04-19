import { prisma } from "../../config/prisma";
import type { Prisma } from "../../generated/prisma/client";
import { CreateRoutineInput } from "./routine.model";

type RoutineModel = Prisma.routineGetPayload<Record<string, never>>;
type RoutineWithHistoryModel = Prisma.routineGetPayload<{
  include: {
    history: {
      select: {
        completed_at: true;
      };
      orderBy: {
        completed_at: "desc";
      };
    };
  };
}>;

class RoutineRepository {
  async createRoutine(input: CreateRoutineInput): Promise<RoutineModel> {
    return await prisma.routine.create({
      data: {
        user_id: input.userId,
        content: input.content,
        type: input.type,
        days_of_week: input.daysOfWeek,
        day_of_month: input.dayOfMonth ?? null,
      },
    });
  }

  async softDeleteRoutine(userId: string, routineId: string): Promise<boolean> {
    const result = await prisma.routine.updateMany({
      where: {
        routine_id: routineId,
        user_id: userId,
        deleted_at: null,
      },
      data: {
        deleted_at: new Date(),
      },
    });

    return result.count > 0;
  }

  async findActiveRoutinesWithHistory(
    userId: string,
  ): Promise<RoutineWithHistoryModel[]> {
    return await prisma.routine.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
      },
      include: {
        history: {
          select: {
            completed_at: true,
          },
          orderBy: {
            completed_at: "desc",
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }

  async findActiveRoutineWithHistoryById(
    userId: string,
    routineId: string,
  ): Promise<RoutineWithHistoryModel | null> {
    return await prisma.routine.findFirst({
      where: {
        routine_id: routineId,
        user_id: userId,
        deleted_at: null,
      },
      include: {
        history: {
          select: {
            completed_at: true,
          },
          orderBy: {
            completed_at: "desc",
          },
        },
      },
    });
  }

  async createRoutineHistory(
    routineId: string,
    completedAt: Date,
  ): Promise<void> {
    await prisma.routine_history.create({
      data: {
        routine_id: routineId,
        completed_at: completedAt,
      },
    });
  }

  async deleteRoutineHistoryByDate(
    routineId: string,
    completedAt: Date,
  ): Promise<boolean> {
    const result = await prisma.routine_history.deleteMany({
      where: {
        routine_id: routineId,
        completed_at: completedAt,
      },
    });

    return result.count > 0;
  }
}

export const routineRepository = new RoutineRepository();
