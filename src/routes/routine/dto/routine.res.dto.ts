export class CreateRoutineResponseDto {
  routineId!: string;
  content!: string;
  type!: string;
  daysOfWeek!: number[];
  dayOfMonth?: number;
  createdAt!: Date;
}

export class RoutineListItemDto {
  routineId!: string;
  content!: string;
  type!: string;
  daysOfWeek!: number[];
  dayOfMonth?: number;
  scheduledFor?: Date;
  completedAt?: Date;
}

export class GetRoutineListResponseDto {
  tab!: string;
  count!: number;
  routines!: RoutineListItemDto[];
}

export class ToggleRoutineStatusResponseDto {
  routineId!: string;
  completed!: boolean;
  completedAt?: Date;
}
