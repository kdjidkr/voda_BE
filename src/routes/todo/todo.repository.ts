import { prisma } from "../../config/prisma";
import type { Prisma } from "../../generated/prisma/client";

import { CreateTodoInput } from "./todo.model";

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
}

export const todoRepository = new TodoRepository();
