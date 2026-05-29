import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";
import { kstDayjs } from "../../utils/date";
import { todoRepository } from "../todo/todo.repository";
import { usersRepository } from "../users/users.repository";
import {
  validateDateString,
  validateNonEmptyText,
  validatePhotoUrls,
  validateUuid,
  validateYearMonth,
} from "../utils/validators";
import { BasicDiaryInput, UpdateBasicDiaryInput } from "./diaries.model";
import { diariesRepository } from "./diaries.repository";
import {
  CreateBasicDiaryRequestDto,
  PredictDiaryRequestDto,
  UpdateBasicDiaryRequestDto,
} from "./dto/diaries.req.dto";
import {
  CreateBasicDiaryResponseDto,
  CreateKeywordResponseDto,
  MonthlyDiarySummaryDateGroupDto,
  MonthlyDiarySummaryResponseDto,
  PredictDiaryResponseDto,
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
    return kstDayjs(date).format("YYYY-MM-DD");
  }

  async createKeywords(
    userId: string,
    diaryId: string,
    keywordTexts: string[],
  ): Promise<CreateKeywordResponseDto> {
    // UUID 형식 검증
    const validDiaryId = validateUuid(diaryId, ErrorCode.INVALID007);

    // 키워드가 3개 이상인지 검증
    if (!keywordTexts || keywordTexts.length < 3) {
      throw new HttpException(ErrorCode.KEYWORD001);
    }

    //다이어리 조회
    const diary = await diariesRepository.findDiaryById(userId, validDiaryId);

    if (!diary) {
      throw new HttpException(ErrorCode.DIARY002);
    }

    // 키워드 저장
    const result = await diariesRepository.createKeywords(
      validDiaryId,
      keywordTexts.map((keyword) => keyword.trim()),
    );

    return {
      keywords: result,
    };
  }

  async predictDiary(
    userId: string,
    requestBody: PredictDiaryRequestDto,
  ): Promise<PredictDiaryResponseDto> {
    const { targetDate: rawTargetDate } = requestBody;
    const targetDate = validateDateString(rawTargetDate, ErrorCode.INVALID024);

    // 1. 사용자 정보 조회 및 나이/성별 가공
    const userProfile = await usersRepository.findUserMeBaseProfile(userId);
    if (!userProfile) {
      throw new HttpException(ErrorCode.USER001);
    }

    const age = kstDayjs().diff(kstDayjs(userProfile.birth_date), "year");
    const gender = userProfile.gender;

    // 2. targetDate 기준 KST 하루 범위 계산
    const targetDay = kstDayjs(targetDate).startOf("day");

    // 3. 해당 날짜의 할 일(Todo) 목록 및 상태 조회 (TodoRepository 위임)
    const todos = await todoRepository.findTodosByDate(userId, targetDay.toDate());

    // 4. targetDate 이전의 최근 10개 일기 조회 및 연대순 정렬 (DiariesRepository 위임)
    const rawDiaries = await diariesRepository.findRecentDiariesBeforeDate(
      userId,
      targetDay.toDate(),
      10,
    );

    const diaries = rawDiaries.reverse().map((d) => d.content);

    // 5. 할 일 목록을 문자열 배열 형태로 가공
    const todoStrings = todos.map(
      (t) => `[${t.status ? "완료" : "미완료"}] ${t.content}`,
    );

    // 6. 외부 AI API 전송용 페이로드 구성
    const requestPayload = {
      targetDate,
      userInfo: {
        gender,
        age,
      },
      diaries,
      todos: todoStrings,
      routineHistory: [], // 루틴 기능 폐기로 빈 배열 설정
    };

    // 7. 외부 AI API 호출 (15초 타임아웃 적용)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch("https://voda-ai-api.p-e.kr/diaries/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `AI API 호출에 실패했습니다: Status=${response.status}, StatusText=${response.statusText}, Body=${errorText}`,
        );
        throw new HttpException(
          502,
          "AI API 호출에 실패했습니다.",
          "AI_API_ERROR",
        );
      }

      const aiResponse = await response.json();

      // 8. AI 응답에서 일기 내용 추출 (확정된 응답 규격 반영)
      const diaryContent = aiResponse.data?.predicted_diary;

      if (!diaryContent || typeof diaryContent !== "string" || diaryContent.trim() === "") {
        console.error(`AI API 응답에 예측된 일기 내용이 없습니다: ${JSON.stringify(aiResponse)}`);
        throw new HttpException(
          502,
          "AI API의 응답 형식이 올바르지 않거나 예측된 일기 내용이 비어있습니다.",
          "AI_API_ERROR",
        );
      }

      const trimmedDiaryContent = diaryContent.trim();

      // 9. DB에 AI 예측 일기 자동 저장 (DiariesRepository 위임)
      const saved = await diariesRepository.createAiPredictedDiary(
        userId,
        `${targetDate}의 일기`,
        trimmedDiaryContent,
        trimmedDiaryContent, // initialDraft for text-based AI prediction
        targetDay.toDate(),
      );

      // 10. AI 응답 원본과 DB 저장 정보를 결합하여 프론트엔드로 즉시 반환
      return {
        prediction: aiResponse,
        savedDiary: {
          diaryId: saved.diary_id,
          title: saved.title,
          content: saved.content,
          diaryDate: saved.diary_date,
          inputType: saved.input_type,
          createdAt: saved.created_at,
        },
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError" || error.message?.includes("aborted")) {
        throw new HttpException(
          504,
          "AI API 요청 시간이 초과되었습니다.",
          "AI_API_TIMEOUT",
        );
      }
      throw error;
    }
  }
  public async predictDiaryFromVoice(
    userId: string,
    file: Express.Multer.File,
    targetDate: string,
  ): Promise<any> {
    const validatedTargetDate = validateDateString(targetDate, ErrorCode.INVALID024);

    // 1. 사용자 정보 조회 (기본 유효성 검사)
    const userProfile = await usersRepository.findUserMeBaseProfile(userId);
    if (!userProfile) {
      throw new HttpException(ErrorCode.USER001);
    }
    
    const targetDay = kstDayjs(validatedTargetDate).startOf("day");
    
    // 2. 음성 파일을 AI 서버로 전송 (STT)
    const fs = require("fs");
    let fileBuffer: Buffer;
    if (file.buffer) {
      fileBuffer = file.buffer;
    } else if ((file as any).location) {
      // multer-s3를 통해 S3에 업로드된 경우 URL에서 다운로드
      const s3Url = (file as any).location;
      const s3Response = await fetch(s3Url);
      if (!s3Response.ok) throw new HttpException(500, "S3에서 음성 파일을 가져오지 못했습니다.", "FILE_ERROR");
      fileBuffer = Buffer.from(await s3Response.arrayBuffer());
    } else if (file.path && fs.existsSync(file.path)) {
      fileBuffer = fs.readFileSync(file.path);
    } else {
      throw new HttpException(400, "파일 데이터를 찾을 수 없습니다.", "INVALID_REQUEST");
    }

    const formData = new FormData();
    const fileObj = new File([new Uint8Array(fileBuffer)], file.originalname || "voice_record.mp3", { type: file.mimetype });
    formData.append("file", fileObj);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 대기

    let sttText = "";
    try {
      const voiceResponse = await fetch("https://voda-ai-api.p-e.kr/voices", {
        method: "POST",
        body: formData as any,
        signal: controller.signal,
      });

      if (!voiceResponse.ok) {
        const errorText = await voiceResponse.text();
        console.error(`AI STT API 호출 실패: Status=${voiceResponse.status}, Body=${errorText}`);
        throw new HttpException(502, "AI STT API 호출에 실패했습니다.", "AI_API_ERROR");
      }
      
      let rawSttData: any;
      const responseText = await voiceResponse.text();
      try {
        rawSttData = JSON.parse(responseText);
      } catch (e) {
        rawSttData = responseText;
      }

      if (typeof rawSttData === "string") {
        sttText = rawSttData;
      } else if (rawSttData && typeof rawSttData.transcript === "string") {
        sttText = rawSttData.transcript;
      } else if (rawSttData && typeof rawSttData.text === "string") {
        sttText = rawSttData.text;
      } else if (rawSttData && typeof rawSttData.data === "string") {
        sttText = rawSttData.data;
      } else {
        console.error("AI STT 응답 파싱 실패:", rawSttData);
        throw new HttpException(502, `AI STT 응답 형식이 올바르지 않습니다. (받은 값: ${JSON.stringify(rawSttData)})`, "AI_API_ERROR");
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError" || error.message?.includes("aborted")) {
        throw new HttpException(504, "AI STT API 요청 시간이 초과되었습니다.", "AI_API_TIMEOUT");
      }
      throw error;
    }

    clearTimeout(timeoutId);

    // 3. 변환된 STT 텍스트를 이용해 일기 생성
    let diaryContent = "";
    
    const diaryController = new AbortController();
    const diaryTimeoutId = setTimeout(() => diaryController.abort(), 30000); // 새로운 30초 대기

    try {
      const diaryResponse = await fetch("https://voda-ai-api.p-e.kr/diaries/from-texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: [sttText] }),
        signal: diaryController.signal,
      });

      clearTimeout(diaryTimeoutId);

      if (!diaryResponse.ok) {
        const errorText = await diaryResponse.text();
        console.error(`AI 일기 생성 API 호출 실패: Status=${diaryResponse.status}, Body=${errorText}`);
        throw new HttpException(502, "AI 일기 생성 API 호출에 실패했습니다.", "AI_API_ERROR");
      }

      let rawDiaryData: any;
      const diaryResponseText = await diaryResponse.text();
      try {
        rawDiaryData = JSON.parse(diaryResponseText);
      } catch (e) {
        rawDiaryData = diaryResponseText;
      }

      if (typeof rawDiaryData === "string") {
        diaryContent = rawDiaryData;
      } else if (rawDiaryData && typeof rawDiaryData.generated_diary === "string") {
        diaryContent = rawDiaryData.generated_diary;
      } else if (rawDiaryData && typeof rawDiaryData.text === "string") {
        diaryContent = rawDiaryData.text;
      } else if (rawDiaryData && typeof rawDiaryData.data === "string") {
        diaryContent = rawDiaryData.data;
      } else {
        console.error("AI 일기 생성 API 응답 파싱 실패:", rawDiaryData);
        throw new HttpException(502, `AI 일기 생성 API의 응답 형식이 올바르지 않습니다. (받은 값: ${JSON.stringify(rawDiaryData)})`, "AI_API_ERROR");
      }

      if (!diaryContent || diaryContent.trim() === "") {
        throw new HttpException(502, "AI 일기 생성 API에서 빈 텍스트를 반환했습니다.", "AI_API_ERROR");
      }
    } catch (error: any) {
      clearTimeout(diaryTimeoutId);
      if (error.name === "AbortError" || error.message?.includes("aborted")) {
        throw new HttpException(504, "AI 일기 생성 API 요청 시간이 초과되었습니다.", "AI_API_TIMEOUT");
      }
      throw error;
    }

    const trimmedDiaryContent = diaryContent.trim();

    // 4. DB에 일기 저장
    const saved = await diariesRepository.createAiPredictedDiary(
      userId,
      `${validatedTargetDate}의 일기`,
      trimmedDiaryContent,
      sttText,
      targetDay.toDate(),
      "VOICE"
    );

    // 5. 프론트엔드로 즉시 반환
    return {
      prediction: {
        success: true,
        data: {
          status: "success",
          predicted_date: validatedTargetDate,
          predicted_diary: trimmedDiaryContent,
          stt_text: sttText
        }
      },
      savedDiary: {
        diaryId: saved.diary_id,
        title: saved.title,
        content: saved.content,
        diaryDate: saved.diary_date,
        inputType: saved.input_type,
        createdAt: saved.created_at,
      },
    };
  }
}

export const diariesService = new DiariesService();
