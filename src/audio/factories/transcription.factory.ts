// audio/factories/transcription.factory.ts

import type { ITranscriptionService } from '~/audio/interfaces/transcription.interface';
import { GroqTranscriptionService } from '~/audio/services/groq-transcription.service';
import { LocalWhisperTranscriptionService } from '~/audio/services/local-whisper-transcription.service';

export type TranscriptionProvider = 'local' | 'groq';

// Mismo patrón que el selector de servicios AI: el proveedor se elige
// por variable de entorno sin tocar el código de los flujos
export const createTranscriptionService = (): ITranscriptionService => {
  const provider = (process.env.TRANSCRIPTION_PROVIDER ?? 'local') as TranscriptionProvider;

  switch (provider) {
    case 'groq':
      return new GroqTranscriptionService();
    case 'local':
      return new LocalWhisperTranscriptionService();
    default:
      throw new Error(`Proveedor de transcripción desconocido: ${provider as string}`);
  }
};
