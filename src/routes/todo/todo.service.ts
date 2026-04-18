import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";
import { validateNonEmptyText } from "../utils/validators";

import { CreateTodoRequestDto } from "./dto/todo.req.dto";
import { CreateTodoResponseDto } from "./dto/todo.res.dto";
import { CreateTodoInput } from "./todo.model";
import { todoRepository } from "./todo.repository";

class TodoService {
	async createTodo(
		userId: string,
		requestBody: CreateTodoRequestDto,
	): Promise<CreateTodoResponseDto> {
		const content = validateNonEmptyText(requestBody.content, ErrorCode.INVALID011);
		const dueTo = this.validateDueTo(requestBody.dueTo);

		const createTodoInput: CreateTodoInput = {
			userId,
			content,
			dueTo,
		};

		const result = await todoRepository.createTodo(createTodoInput);

		return {
			todoId: result.todo_id,
			content: result.content ?? '',
			dueTo: result.due_to ?? undefined,
			status: result.status,
			completedAt: result.completed_at ?? undefined,
			createdAt: result.created_at,
		};
	}

	private validateDueTo(value?: Date): Date | undefined {
		if (!value) {
			return undefined;
		}

		const dueToDate = value instanceof Date ? value : new Date(value);

		if (Number.isNaN(dueToDate.getTime())) {
			throw new HttpException(ErrorCode.INVALID012);
		}

		return dueToDate;
	}
}

export const todoService = new TodoService();
