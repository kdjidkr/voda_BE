export class CreateTodoResponseDto {
  todoId!: string;
  content!: string;
  dueTo?: Date;
  status!: boolean;
  completedAt?: Date;
  createdAt!: Date;
}

export class TodoItemDto {
  todoId!: string;
  content!: string;
  dueTo?: Date;
  status!: boolean;
  completedAt?: Date;
  createdAt!: Date;
}

export class GetTodoListResponseDto {
  filter!: string;
  limit!: number;
  count!: number;
  nextCursor?: string;
  todos!: TodoItemDto[];
}
