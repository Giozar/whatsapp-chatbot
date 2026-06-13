import type { ITranscriptionService } from '~/features/voice/interfaces/transcription.interface';
import { GroqTranscriptionService } from '~/features/voice/services/groq-transcription.service';
import { LocalWhisperTranscriptionService } from '~/features/voice/services/local-whisper-transcription.service';
import { appConfig } from '~/shared/config/app-config';

export const createTranscriptionService = (): ITranscriptionService => {
    switch (appConfig.voice.mode === 'local' ? 'local' : appConfig.voice.provider) {
        case 'groq':
            return new GroqTranscriptionService();
        case 'local':
            return new LocalWhisperTranscriptionService();
        default:
            throw new Error(
                `Unsupported transcription provider: ${appConfig.voice.provider as string}`
            );
    }
};
