export interface CreateTodoInput {
	userId: string;
	content: string;
	dueTo?: Date;
}

export interface ToggleTodoStatusInput {
	userId: string;
	todoId: string;
	currentStatus: boolean;
}
