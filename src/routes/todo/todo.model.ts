export interface CreateTodoInput {
	userId: string;
	content: string;
	dueTo?: Date;
}
