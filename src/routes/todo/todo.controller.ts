import {
	Body,
	Controller,
	Example,
	Get,
	Patch,
	Path,
	Post,
	Query,
	Request,
	Response,
	Route,
	Security,
	SuccessResponse,
	Tags,
} from "tsoa";

import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";
import { ApiResponse } from "../../interfaces/ApiResponse";

import { CreateTodoRequestDto } from "./dto/todo.req.dto";
import { CreateTodoResponseDto, GetTodoListResponseDto } from "./dto/todo.res.dto";
import { todoService } from "./todo.service";

@Route("todo")
@Tags("할 일 기능")
export class TodoController extends Controller {
	/**
	 * @summary 할 일 목록을 조회합니다.
	 * @description status 쿼리로 전체(all), 미완료(pending), 완료(completed) 목록을 필터링할 수 있습니다.
	 */
	@Security("jwt")
	@SuccessResponse(200, "할 일 목록 조회 성공")
	@Example<ApiResponse<GetTodoListResponseDto>>({
		success: true,
		data: {
			filter: "pending",
			limit: 20,
			count: 2,
			nextCursor: "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
			todos: [
				{
					todoId: "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
					content: "우유 사기",
					dueTo: new Date("2026-04-18T12:00:00.000Z"),
					status: false,
					completedAt: undefined,
					createdAt: new Date("2026-04-16T09:00:00.000Z"),
				},
			],
		},
	})
	@Response<ApiResponse<null>>(400, "status 필터 값이 올바르지 않은 경우", {
		success: false,
		error: {
			code: "INVALID013",
			message: "할 일 조회 상태 필터 값이 올바르지 않습니다.",
		},
	})
	@Response<ApiResponse<null>>(400, "limit 값이 올바르지 않은 경우", {
		success: false,
		error: {
			code: "INVALID014",
			message: "할 일 조회 페이지 크기(limit) 값이 올바르지 않습니다.",
		},
	})
	@Response<ApiResponse<null>>(400, "cursor가 UUID 형식이 아닌 경우", {
		success: false,
		error: {
			code: "INVALID007",
			message: "유효하지 않은 UUID 형식입니다.",
		},
	})
	@Response<ApiResponse<null>>(401, "액세스 토큰이 유효하지 않은 경우", {
		success: false,
		error: {
			code: "AUTH008",
			message: "액세스 토큰이 유효하지 않습니다.",
		},
	})
	@Get("/")
	public async getTodos(
		@Request() req: any,
		@Query() status?: "all" | "pending" | "completed",
		@Query() limit?: string,
		@Query() cursor?: string,
	): Promise<ApiResponse<GetTodoListResponseDto>> {
		const userId = req.user?.sub;

		if (!userId) {
			throw new HttpException(ErrorCode.AUTH008);
		}

		const result = await todoService.getTodos(userId, status, limit, cursor);
		this.setStatus(200);

		return {
			success: true,
			data: result,
		};
	}

	/**
	 * @summary 할 일을 등록합니다.
	 * @description 일회성 할 일을 생성하며, 마감 기한은 선택값입니다.
	 */
	@Security("jwt")
	@SuccessResponse(201, "할 일 생성 성공")
	@Example<ApiResponse<CreateTodoResponseDto>>({
		success: true,
		data: {
			todoId: "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
			content: "우유 사기",
			dueTo: new Date("2026-04-18T12:00:00.000Z"),
			status: false,
			completedAt: undefined,
			createdAt: new Date("2026-04-16T09:00:00.000Z"),
		},
	})
	@Response<ApiResponse<null>>(400, "할 일 내용이 공백인 경우", {
		success: false,
		error: {
			code: "INVALID011",
			message: "할 일 내용은 공백일 수 없습니다.",
		},
	})
	@Response<ApiResponse<null>>(400, "마감 기한 형식이 올바르지 않은 경우", {
		success: false,
		error: {
			code: "INVALID012",
			message: "마감 기한 형식이 올바르지 않습니다.",
		},
	})
	@Response<ApiResponse<null>>(401, "액세스 토큰이 유효하지 않은 경우", {
		success: false,
		error: {
			code: "AUTH008",
			message: "액세스 토큰이 유효하지 않습니다.",
		},
	})
	@Post("/")
	public async createTodo(
		@Body() requestBody: CreateTodoRequestDto,
		@Request() req: any,
	): Promise<ApiResponse<CreateTodoResponseDto>> {
		const userId = req.user?.sub;

		if (!userId) {
			throw new HttpException(ErrorCode.AUTH008);
		}

		const result = await todoService.createTodo(userId, requestBody);
		this.setStatus(201);

		return {
			success: true,
			data: result,
		};
	}

	/**
	 * @summary 할 일 완료 상태를 변경합니다.
	 * @description 미완료일 때는 완료로 변경하며 completed_at을 현재 시각으로 저장하고, 완료일 때는 미완료로 변경하며 completed_at을 null로 초기화합니다.
	 */
	@Security("jwt")
	@SuccessResponse(200, "할 일 상태 변경 성공")
	@Example<ApiResponse<CreateTodoResponseDto>>({
		success: true,
		data: {
			todoId: "58d5db0b-5837-4933-b2d4-f032cb7a8a64",
			content: "우유 사기",
			dueTo: new Date("2026-04-18T12:00:00.000Z"),
			status: true,
			completedAt: new Date("2026-04-18T03:12:00.000Z"),
			createdAt: new Date("2026-04-16T09:00:00.000Z"),
		},
	})
	@Response<ApiResponse<null>>(400, "todoId가 UUID 형식이 아닌 경우", {
		success: false,
		error: {
			code: "INVALID007",
			message: "유효하지 않은 UUID 형식입니다.",
		},
	})
	@Response<ApiResponse<null>>(401, "액세스 토큰이 유효하지 않은 경우", {
		success: false,
		error: {
			code: "AUTH008",
			message: "액세스 토큰이 유효하지 않습니다.",
		},
	})
	@Response<ApiResponse<null>>(404, "조회할 할 일이 없거나 본인 소유가 아닌 경우", {
		success: false,
		error: {
			code: "TODO001",
			message: "조회할 할 일을 찾을 수 없거나 접근 권한이 없습니다.",
		},
	})
	@Patch("{todoId}/status")
	public async toggleTodoStatus(
		@Path() todoId: string,
		@Request() req: any,
	): Promise<ApiResponse<CreateTodoResponseDto>> {
		const userId = req.user?.sub;

		if (!userId) {
			throw new HttpException(ErrorCode.AUTH008);
		}

		const result = await todoService.toggleTodoStatus(userId, todoId);
		this.setStatus(200);

		return {
			success: true,
			data: result,
		};
	}
}
