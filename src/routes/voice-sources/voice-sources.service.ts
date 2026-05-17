import { ErrorCode } from "../../errors/ErrorCodes";
import { HttpException } from "../../errors/HttpException";
import { ApiResponse } from "../../interfaces/ApiResponse";
import { validateNonEmptyText } from "../utils/validators";
import { CreateVoiceSourceResponseDto } from "./dto/voice-sources.res.dto";
import { voiceSourcesRepository } from "./voice-sources.repository";

class VoiceSourcesService {
    async createVoiceSource(
        voiceText: string,
    ): Promise<CreateVoiceSourceResponseDto> {

        validateNonEmptyText(voiceText, ErrorCode.VOICE_SOURCE001)

        const createdVoiceSource = await voiceSourcesRepository.createVoiceSource(
            voiceText,
        );

        return {
            voiceId: createdVoiceSource.voice_id,
            voiceText: createdVoiceSource.voice_text,
        };
    }

    async getVoiceSources(): Promise<ApiResponse<CreateVoiceSourceResponseDto[]>> {
        const voiceSources = await voiceSourcesRepository.getVoiceSources();

        return {
            success: true,
            data: voiceSources.map((voiceSource) => ({
                voiceId: voiceSource.voice_id,
                voiceText: voiceSource.voice_text,
            })),
        };
    }

    async getVoiceSourceById(voiceId: string): Promise<ApiResponse<CreateVoiceSourceResponseDto>> {
        const voiceSource = await voiceSourcesRepository.getVoiceSourceById(voiceId);

        if (!voiceSource) {
            throw new HttpException(ErrorCode.VOICE_SOURCE002);
        }

        return {
            success: true,
            data: {
                voiceId: voiceSource.voice_id,
                voiceText: voiceSource.voice_text,
            },
        };
    }
}

export const voiceSourcesService = new VoiceSourcesService();