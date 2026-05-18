import { prisma } from "../../config/prisma";
import { VoiceSourceModel } from "./voice-sources.model";


class VoiceSourcesRepository {

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

    async getVoiceSources(): Promise<VoiceSourceModel[]> {
        return prisma.voice_source.findMany();
    }

    async getVoiceSourceById(voiceId: string): Promise<VoiceSourceModel | null> {
        return prisma.voice_source.findUnique({
            where: {
                voice_id: voiceId,
            },
        });
    }
}

export const voiceSourcesRepository = new VoiceSourcesRepository();