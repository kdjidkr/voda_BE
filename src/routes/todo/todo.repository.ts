import { prisma } from "../../config/prisma";
import type { Prisma } from "../../generated/prisma/client";
import {
  CreateTodoInput,
  TodoStatusFilter,
  ToggleTodoStatusInput,
} from "./todo.model";

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

  async findTodoById(
    userId: string,
    todoId: string,
  ): Promise<TodoModel | null> {
    return await prisma.todo_list.findFirst({
      where: {
        todo_id: todoId,
        user_id: userId,
      },
    });
  }

  async findTodosByUser(
    userId: string,
    filter: TodoStatusFilter,
  ): Promise<TodoModel[]> {
    const statusCondition =
      filter === "pending" ? false : filter === "completed" ? true : undefined;

    return await prisma.todo_list.findMany({
      where: {
        user_id: userId,
        status: statusCondition,
      },
      orderBy: [
        {
          created_at: "desc",
        },
        {
          todo_id: "desc",
        },
      ],
    });
  }

  async findTodosByUserWithPagination(
    userId: string,
    filter: TodoStatusFilter,
    limit: number,
    cursor?: string,
  ): Promise<TodoModel[]> {
    const statusCondition =
      filter === "pending" ? false : filter === "completed" ? true : undefined;

    return await prisma.todo_list.findMany({
      where: {
        user_id: userId,
        status: statusCondition,
      },
      orderBy: [
        {
          created_at: "desc",
        },
        {
          todo_id: "desc",
        },
      ],
      ...(cursor
        ? {
            cursor: {
              todo_id: cursor,
            },
            skip: 1,
          }
        : {}),
      take: limit + 1,
    });
  }

  async toggleTodoStatus(
    input: ToggleTodoStatusInput,
  ): Promise<TodoModel | null> {
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

  async deleteTodo(userId: string, todoId: string): Promise<boolean> {
    const result = await prisma.todo_list.deleteMany({
      where: {
        todo_id: todoId,
        user_id: userId,
      },
    });

    return result.count > 0;
  }
}

export const todoRepository = new TodoRepository();
