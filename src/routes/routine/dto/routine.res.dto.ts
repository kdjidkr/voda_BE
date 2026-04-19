export class CreateRoutineResponseDto {
  routineId!: string;
  content!: string;
  type!: string;
  daysOfWeek!: number[];
  dayOfMonth?: number;
  createdAt!: Date;
}
