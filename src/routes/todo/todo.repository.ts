import { prisma } from "../../config/prisma";
import type { Prisma } from "../../generated/prisma/client";

import { CreateTodoInput, ToggleTodoStatusInput } from "./todo.model";

type TodoModel = Prisma.todo_listGetPayload<Record<string, never>>;

class TodoRepository {
	async createTodo(input: CreateTodoInput): Promise<TodoModel> {
		return await prisma.todo_list.create({
			data: {
				user_id: input.userId,
				content: input.content,
				due_to: input.dueTo ?? null,
			},
		});
	}

	async findTodoById(userId: string, todoId: string): Promise<TodoModel | null> {
		return await prisma.todo_list.findFirst({
			where: {
				todo_id: todoId,
				user_id: userId,
			},
		});
	}

	async toggleTodoStatus(input: ToggleTodoStatusInput): Promise<TodoModel | null> {
		const nextStatus = !input.currentStatus;
		const completedAt = nextStatus ? new Date() : null;

		const result = await prisma.todo_list.updateMany({
			where: {
				todo_id: input.todoId,
				user_id: input.userId,
			},
			data: {
				status: nextStatus,
				completed_at: completedAt,
			},
		});

		if (result.count === 0) {
			return null;
		}

		return await prisma.todo_list.findFirst({
			where: {
				todo_id: input.todoId,
				user_id: input.userId,
			},
		});
	}
}

export const todoRepository = new TodoRepository();
