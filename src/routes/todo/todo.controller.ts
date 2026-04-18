import {
	Body,
	Controller,
	Example,
	Post,
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
import { CreateTodoResponseDto } from "./dto/todo.res.dto";
import { todoService } from "./todo.service";

@Route("todo")
@Tags("할 일 기능")
export class TodoController extends Controller {
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
}
