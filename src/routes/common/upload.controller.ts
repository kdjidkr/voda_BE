import {
  Consumes,
  Controller,
  Example,
  Post,
  Response,
  Route,
  SuccessResponse,
  Tags,
  UploadedFile,
  UploadedFiles,
} from "tsoa";

import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";
import type { ApiResponse } from "../../interfaces/ApiResponse";
import { UploadResponseDto } from "./dto/upload.res.dto";
import { UploadMultipleResponseDto } from "./dto/upload-multiple.res.dto";

@Route("common")
@Tags("공통")
export class UploadController extends Controller {
  /**
   * @summary 사진 업로드
   * @description S3에 단일 이미지를 업로드하고 접근 가능한 URL을 반환합니다.
   */
  @Post("upload")
  @Consumes("multipart/form-data")
  @SuccessResponse(201, "업로드 성공")
  @Example<ApiResponse<UploadResponseDto>>({
    success: true,
    data: {
      url: "https://example-bucket.s3.ap-northeast-2.amazonaws.com/diary/1712412345678_123.jpg",
    },
  })
  @Response<ApiResponse<null>>(400, "업로드 파일 누락", {
    success: false,
    error: {
      code: ErrorCode.UPLOAD001.code,
      message: ErrorCode.UPLOAD001.message,
      details: undefined,
    },
  })
  public async uploadImage(
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ApiResponse<UploadResponseDto>> {
    const uploadedFile = file as Express.MulterS3.File | undefined;

    if (!uploadedFile?.location) {
      throw new HttpException(ErrorCode.UPLOAD001);
    }

    this.setStatus(201);

    return {
      success: true,
      data: {
        url: uploadedFile.location,
      },
    };
  }

  /**
   * @summary 다중 사진 업로드
   * @description S3에 여러 이미지를 업로드하고 접근 가능한 URL 목록을 반환합니다.
   */
  @Post("uploads")
  @Consumes("multipart/form-data")
  @SuccessResponse(201, "다중 업로드 성공")
  @Example<ApiResponse<UploadMultipleResponseDto>>({
    success: true,
    data: {
      urls: [
        "https://example-bucket.s3.ap-northeast-2.amazonaws.com/diary/1712412345678_123.jpg",
        "https://example-bucket.s3.ap-northeast-2.amazonaws.com/diary/1712412345679_124.jpg",
      ],
    },
  })
  @Response<ApiResponse<null>>(400, "업로드 파일 누락", {
    success: false,
    error: {
      code: ErrorCode.UPLOAD001.code,
      message: ErrorCode.UPLOAD001.message,
      details: undefined,
    },
  })
  public async uploadImages(
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<ApiResponse<UploadMultipleResponseDto>> {
    const uploadedFiles = files as Express.MulterS3.File[] | undefined;

    if (!uploadedFiles || uploadedFiles.length === 0) {
      throw new HttpException(ErrorCode.UPLOAD001);
    }

    this.setStatus(201);

    return {
      success: true,
      data: {
        urls: uploadedFiles.map((uploadedFile) => uploadedFile.location),
      },
    };
  }
}
