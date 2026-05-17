import {
  Body,
  Controller,
  Example,
  Get,
  Path,
  Post,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";

import { ApiResponse } from "../../interfaces/ApiResponse";

import { CreateVoiceSourceRequestDto } from "./dto/voice-sources.req.dto";
import { CreateVoiceSourceResponseDto } from "./dto/voice-sources.res.dto";
import { voiceSourcesService } from "./voice-sources.service";


@Route("voices")
@Tags("음성 소스 저장, 관리, 조회 등의 기능을 담당합니다.")
export class VoiceSourcesController extends Controller {

    /**
    * @summary 음성 소스를 저장합니다.
    * @description 텍스트로 변환된 음성 소스를 저장하는 API입니다.
    * @returns 저장된 음성 소스
    */
    @Security("jwt")
    @SuccessResponse(201, "음성 소스 저장 성공")
    @Example<ApiResponse<CreateVoiceSourceResponseDto>>({
        success: true,
        data: {
            voiceId: "550e8400-e29b-41d4-a716-446655440000",
            voiceText: "오늘은 진짜 너무 피곤한 날이다. 진짜나 왜 월화수 9시 수업 신청했지..."
        }
    })
    @Response<ApiResponse<null>>(400, "음성 소스가 없는 경우", {
        success: false,
        error: {
            code: "VOICE_SOURCE001",
            message: "저장할 음성 소스 텍스트가 없습니다."
        },
    })
    @Post("/")
    public async createVoiceSource(
        @Body() requestBody: CreateVoiceSourceRequestDto,
    ): Promise<ApiResponse<CreateVoiceSourceResponseDto>> {
        this.setStatus(201);

        const result = await voiceSourcesService.createVoiceSource(
            requestBody.voiceText,
        );
        return {
            success: true,
            data: result
        };
    }

    /**
    * @summary 저장된 음성 소스 목록을 조회합니다.
    * @description 저장된 모든 음성 소스를 조회하는 API입니다.  
    * @returns 저장된 음성 소스 목록
    */
    @Security("jwt")
    @SuccessResponse(200, "음성 소스 목록 조회 성공")
    @Example<ApiResponse<CreateVoiceSourceResponseDto[]>>({
        success: true,
        data: [
          {
            voiceId: "550e8400-e29b-41d4-a716-446655440000",
            voiceText: "오늘은 진짜 너무 피곤한 날이다. 진짜나 왜 월화수 9시 수업 신청했지..."
          },
          {
            voiceId: "550e8400-e29b-41d4-a716-446655440001",
              voiceText: "과거의 나 진짜 너무 싫다."
          }
        ],
      })
    @Get("/")
    public async getVoiceSources(): Promise<ApiResponse<CreateVoiceSourceResponseDto[]>> {
      return await voiceSourcesService.getVoiceSources();
    }

    /**
     * @summary 특정 음성 소스를 조회합니다.
     * @description 음성 소스 ID를 기반으로 특정 음성 소스를 조회하는 API입니다.
     * @param voiceId 조회할 음성 소스의 ID
     * @return 조회된 음성 소스 정보
     */

    @Security("jwt")
    @SuccessResponse(200, "음성 소스 조회 성공")
    @Example<ApiResponse<CreateVoiceSourceResponseDto>>({
        success: true,
        data: {
            voiceId: "550e8400-e29b-41d4-a716-446655440000",
            voiceText: "오늘은 진짜 너무 피곤한 날이다. 진짜나 왜 월화수 9시 수업 신청했지..." 
        },
      })
    @Response<ApiResponse<null>>(404, "음성 소스를 찾을 수 없는 경우", {
        success: false,
        error: {
            code: "VOICE_SOURCE002",
            message: "조회할 음성 소스를 찾을 수 없습니다."
        },
    })
    @Get("/{voiceId}")
    public async getVoiceSourceById(
        @Path() voiceId: string,
    ): Promise<ApiResponse<CreateVoiceSourceResponseDto>> {
        return await voiceSourcesService.getVoiceSourceById(voiceId);
    }
    
  }
