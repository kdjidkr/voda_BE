export class CreateTodoResponseDto {
	todoId!: string;
	content!: string;
	dueTo?: Date;
	status!: boolean;
	completedAt?: Date;
	createdAt!: Date;
}
