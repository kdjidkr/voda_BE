import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";
import { validateNonEmptyText, validateUuid } from "../utils/validators";

import { CreateTodoRequestDto } from "./dto/todo.req.dto";
import {
	CreateTodoResponseDto,
	GetTodoListResponseDto,
	TodoItemDto,
} from "./dto/todo.res.dto";
import {
	CreateTodoInput,
	TodoStatusFilter,
	ToggleTodoStatusInput,
} from "./todo.model";
import { todoRepository } from "./todo.repository";

class TodoService {
	private static readonly DEFAULT_TODO_PAGE_SIZE = 20;
	private static readonly MAX_TODO_PAGE_SIZE = 100;

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

		return this.toCreateTodoResponse(result);
	}

	async toggleTodoStatus(
		userId: string,
		todoId: string,
	): Promise<CreateTodoResponseDto> {
		const normalizedTodoId = validateUuid(todoId, ErrorCode.INVALID007);
		const currentTodo = await todoRepository.findTodoById(userId, normalizedTodoId);

		if (!currentTodo) {
			throw new HttpException(ErrorCode.TODO001);
		}

		const toggleInput: ToggleTodoStatusInput = {
			userId,
			todoId: normalizedTodoId,
			currentStatus: currentTodo.status,
		};

		const result = await todoRepository.toggleTodoStatus(toggleInput);

		if (!result) {
			throw new HttpException(ErrorCode.TODO001);
		}

		return this.toCreateTodoResponse(result);
	}

	async deleteTodo(userId: string, todoId: string): Promise<void> {
		const normalizedTodoId = validateUuid(todoId, ErrorCode.INVALID007);
		const isDeleted = await todoRepository.deleteTodo(userId, normalizedTodoId);

		if (!isDeleted) {
			throw new HttpException(ErrorCode.TODO001);
		}
	}

	async getTodos(
		userId: string,
		status?: TodoStatusFilter,
		limit?: string,
		cursor?: string,
	): Promise<GetTodoListResponseDto> {
		const filter = this.normalizeStatusFilter(status);
		const pageSize = this.normalizePageSize(limit);
		const normalizedCursor = this.normalizeCursor(cursor);
		const todos = await todoRepository.findTodosByUserWithPagination(
			userId,
			filter,
			pageSize,
			normalizedCursor,
		);

		const hasNextPage = todos.length > pageSize;
		const pageTodos = hasNextPage ? todos.slice(0, pageSize) : todos;
		const todoItems = pageTodos.map((todo) => this.toTodoItem(todo));
		const nextCursor = hasNextPage
			? pageTodos[pageTodos.length - 1]?.todo_id
			: undefined;

		return {
			filter,
			limit: pageSize,
			count: todoItems.length,
			nextCursor,
			todos: todoItems,
		};
	}

	private toCreateTodoResponse(result: {
		todo_id: string;
		content: string | null;
		due_to: Date | null;
		status: boolean;
		completed_at: Date | null;
		created_at: Date;
	}): CreateTodoResponseDto {

		const todoItem = this.toTodoItem(result);

		return {
			todoId: todoItem.todoId,
			content: todoItem.content,
			dueTo: todoItem.dueTo,
			status: todoItem.status,
			completedAt: todoItem.completedAt,
			createdAt: todoItem.createdAt,
		};
	}

	private toTodoItem(result: {
		todo_id: string;
		content: string | null;
		due_to: Date | null;
		status: boolean;
		completed_at: Date | null;
		created_at: Date;
	}): TodoItemDto {
		return {
			todoId: result.todo_id,
			content: result.content ?? "",
			dueTo: result.due_to ?? undefined,
			status: result.status,
			completedAt: result.completed_at ?? undefined,
			createdAt: result.created_at,
		};
	}

	private normalizeStatusFilter(status?: string): TodoStatusFilter {
		if (!status || status.trim().length === 0) {
			return "all";
		}

		const normalizedStatus = status.trim().toLowerCase();

		if (
			normalizedStatus !== "all" &&
			normalizedStatus !== "pending" &&
			normalizedStatus !== "completed"
		) {
			throw new HttpException(ErrorCode.INVALID013, { status });
		}

		return normalizedStatus;
	}

	private normalizePageSize(limit?: string): number {
		if (!limit || limit.trim().length === 0) {
			return TodoService.DEFAULT_TODO_PAGE_SIZE;
		}

		const parsed = Number.parseInt(limit, 10);
		const isInvalid =
			Number.isNaN(parsed) ||
			parsed < 1 ||
			parsed > TodoService.MAX_TODO_PAGE_SIZE;

		if (isInvalid) {
			throw new HttpException(ErrorCode.INVALID014, { limit });
		}

		return parsed;
	}

	private normalizeCursor(cursor?: string): string | undefined {
		if (!cursor || cursor.trim().length === 0) {
			return undefined;
		}

		return validateUuid(cursor, ErrorCode.INVALID007);
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
