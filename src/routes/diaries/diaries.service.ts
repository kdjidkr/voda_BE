import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";
import {
  validateNonEmptyText,
  validatePhotoUrls,
  validateUuid,
} from "../utils/validators";
import { BasicDiaryInput } from "./diaries.model";
import { diariesRepository } from "./diaries.repository";
import { CreateBasicDiaryRequestDto } from "./dto/diaries.req.dto";
import { CreateBasicDiaryResponseDto } from "./dto/diaries.res.dto";

export class DiariesService {
  constructor() {}

  async createBasicDiary(
    userId: string,
    requestBody: CreateBasicDiaryRequestDto,
  ): Promise<CreateBasicDiaryResponseDto> {
    const title = validateNonEmptyText(requestBody.title, ErrorCode.INVALID004);
    const content =
      requestBody.content === undefined
        ? ""
        : validateNonEmptyText(requestBody.content, ErrorCode.INVALID005);
    const photos = validatePhotoUrls(requestBody.photos);

    const basicDiaryInput: BasicDiaryInput = {
      userId,
      title,
      content,
      photos,
    };
    const result = await diariesRepository.createBasicDiary(basicDiaryInput);
    // 응답 DTO로 변환
    const responseDto: CreateBasicDiaryResponseDto = {
      diaryId: result.diary_id,
      title: result.title ?? "",
      content: result.content ?? "",
      photos: result.diary_photo.map((photo) => ({
        photoId: photo.diary_photo_id,
        imageUrl: photo.image_url,
      })),
      createdAt: result.created_at,
      inputType: result.input_type,
      inputId: result.input_id ?? undefined,
    };
    return responseDto;
  }

  async deleteDiaryPhoto(userId: string, diaryPhotoId: string): Promise<void> {
    const normalizedDiaryPhotoId = validateUuid(
      diaryPhotoId,
      ErrorCode.INVALID007,
    );

    const deleted = await diariesRepository.deleteDiaryPhoto(
      userId,
      normalizedDiaryPhotoId,
    );

    if (!deleted) {
      throw new HttpException(ErrorCode.DIARY001);
    }
  }

  async getDiaryById(
    userId: string,
    diaryId: string,
  ): Promise<CreateBasicDiaryResponseDto> {
    const normalizedDiaryId = validateUuid(diaryId, ErrorCode.INVALID007);
    const result = await diariesRepository.findDiaryById(
      userId,
      normalizedDiaryId,
    );

    if (!result) {
      throw new HttpException(ErrorCode.DIARY002);
    }

    const responseDto: CreateBasicDiaryResponseDto = {
      diaryId: result.diary_id,
      title: result.title ?? "",
      content: result.content ?? "",
      photos: result.diary_photo.map((photo) => ({
        photoId: photo.diary_photo_id,
        imageUrl: photo.image_url,
      })),
      createdAt: result.created_at,
      inputType: result.input_type,
      inputId: result.input_id ?? undefined,
    };

    return responseDto;
  }
}

export const diariesService = new DiariesService();
