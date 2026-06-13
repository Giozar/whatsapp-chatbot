import { Groq, toFile } from 'groq-sdk';
import type { ITranscriptionService } from '~/features/voice/interfaces/transcription.interface';
import { appConfig } from '~/shared/config/app-config';

export class GroqTranscriptionService implements ITranscriptionService {
    private readonly groq = new Groq({ apiKey: appConfig.voice.cloud.apiKey });

    async transcribe(audioBuffer: Buffer, mimeType = 'audio/ogg'): Promise<string> {
        try {
            const extension = mimeType.includes('ogg')
                ? 'ogg'
                : mimeType.includes('mp4') || mimeType.includes('mpeg')
                  ? 'mp3'
                  : 'ogg';

            const file = await toFile(audioBuffer, `voice-note.${extension}`, {
                type: mimeType,
            });

            const response = await this.groq.audio.transcriptions.create({
                file,
                model: appConfig.voice.cloud.model,
                language: 'es',
                response_format: 'json',
            });

            return response.text.trim();
        } catch (error) {
            console.error('[GroqTranscriptionService] Error transcribing audio:', error);
            throw error;
        }
    }
}
