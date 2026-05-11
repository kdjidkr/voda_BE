import { HttpException } from "../../errors/HttpException";
import { ErrorCode } from "../../errors/ErrorCodes";
import { voiceSourcesRepository } from "./voice-sources.repository";
import { CreateVoiceSourceResponseDto } from "./dto/voice-sources.res.dto";

class VoiceSourcesService {
    async createVoiceSource(
        voiceText: string,
    ): Promise<CreateVoiceSourceResponseDto> {

        if (!voiceText || voiceText.trim() === "") {
            throw new HttpException(ErrorCode.VOICE_SOURCE001);
        }

        const createdVoiceSources = await voiceSourcesRepository.createVoiceSource(
            voiceText,
        );

        return {
            voiceId: createdVoiceSources.voice_id,
            voiceText: createdVoiceSources.voice_text,
        };
    }
}

export const voiceSourcesService = new VoiceSourcesService();