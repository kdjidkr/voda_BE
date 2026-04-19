import { prisma } from "../../config/prisma";
import type { Prisma } from "../../generated/prisma/client";
import { CreateRoutineInput } from "./routine.model";

type RoutineModel = Prisma.routineGetPayload<Record<string, never>>;

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
}

export const routineRepository = new RoutineRepository();
