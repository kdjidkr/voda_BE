import { prisma } from "../../config/prisma";
import { VoiceSourceModel } from "./voice-sources.model";


class VoiceSourcesRepository {
    constructor() {}

    async createVoiceSource(
        voiceText: string,
    ): Promise<VoiceSourceModel> {
        const createdVoiceSource = await prisma.voice_source.create({
            data: {
                voice_text: voiceText,
            },
        });

        return createdVoiceSource;
    }
}

export const voiceSourcesRepository = new VoiceSourcesRepository();