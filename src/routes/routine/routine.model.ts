export type RoutineType = "DAILY" | "WEEKLY" | "MONTHLY";

export type RoutineTabType = "incomplete" | "scheduled" | "completed";

export interface CreateRoutineInput {
  userId: string;
  content: string;
  type: RoutineType;
  daysOfWeek: number[];
  dayOfMonth?: number;
}
