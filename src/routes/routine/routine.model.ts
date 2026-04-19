export type RoutineType = "DAILY" | "WEEKLY" | "MONTHLY";

export interface CreateRoutineInput {
  userId: string;
  content: string;
  type: RoutineType;
  daysOfWeek: number[];
  dayOfMonth?: number;
}
