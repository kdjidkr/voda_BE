import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";
import {
  validateNonEmptyText,
  validatePhotoUrls,
  validateUuid,
  validateYearMonth,
} from "../utils/validators";
import { BasicDiaryInput, UpdateBasicDiaryInput } from "./diaries.model";
import { diariesRepository } from "./diaries.repository";
import {
  CreateBasicDiaryRequestDto,
  UpdateBasicDiaryRequestDto,
} from "./dto/diaries.req.dto";
import {
  CreateBasicDiaryResponseDto,
  MonthlyDiarySummaryDateGroupDto,
  MonthlyDiarySummaryResponseDto,
} from "./dto/diaries.res.dto";

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

  async getMonthlyDiarySummaries(
    userId: string,
    year: string,
    month: string,
  ): Promise<MonthlyDiarySummaryResponseDto> {
    const normalizedYearMonth = validateYearMonth(
      year,
      month,
      ErrorCode.INVALID010,
    );

    const result = await diariesRepository.findMonthlyDiarySummaries(
      userId,
      normalizedYearMonth.year,
      normalizedYearMonth.month,
    );

    const dateMap = new Map<string, MonthlyDiarySummaryDateGroupDto>();

    for (const diary of result) {
      const dateKey = this.formatDateKey(diary.diary_date);
      const existingGroup = dateMap.get(dateKey);

      const summaryItem = {
        diaryId: diary.diary_id,
        title: diary.title ?? "",
        createdAt: diary.created_at,
      };

      if (existingGroup) {
        existingGroup.diaries.push(summaryItem);
        continue;
      }

      dateMap.set(dateKey, {
        date: dateKey,
        diaries: [summaryItem],
      });
    }

    return {
      year: normalizedYearMonth.year,
      month: normalizedYearMonth.month,
      dates: Array.from(dateMap.values()),
    };
  }

  async updateBasicDiary(
    userId: string,
    diaryId: string,
    requestBody: UpdateBasicDiaryRequestDto,
  ): Promise<CreateBasicDiaryResponseDto> {
    const normalizedDiaryId = validateUuid(diaryId, ErrorCode.INVALID007);
    const hasTitle = requestBody.title !== undefined;
    const hasContent = requestBody.content !== undefined;

    if (!hasTitle && !hasContent) {
      throw new HttpException(ErrorCode.INVALID009);
    }

    const updateBasicDiaryInput: UpdateBasicDiaryInput = {};

    if (hasTitle) {
      updateBasicDiaryInput.title = validateNonEmptyText(
        requestBody.title,
        ErrorCode.INVALID004,
      );
    }

    if (hasContent) {
      updateBasicDiaryInput.content = validateNonEmptyText(
        requestBody.content,
        ErrorCode.INVALID005,
      );
    }

    const result = await diariesRepository.updateBasicDiary(
      userId,
      normalizedDiaryId,
      updateBasicDiaryInput,
    );

    if (!result) {
      throw new HttpException(ErrorCode.DIARY002);
    }

    return {
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
  }

  private formatDateKey(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
}

export const diariesService = new DiariesService();
