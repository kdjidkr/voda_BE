import { ErrorCode } from "../../errors/ErrorCodes";
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
}

export const voiceSourcesService = new VoiceSourcesService();