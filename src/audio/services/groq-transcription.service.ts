// audio/services/groq-transcription.service.ts

import { Groq, toFile } from 'groq-sdk';
import type { ITranscriptionService } from '~/audio/interfaces/transcription.interface';

export class GroqTranscriptionService implements ITranscriptionService {
  private readonly groq: Groq;

  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  async transcribe(audioBuffer: Buffer, mimeType = 'audio/ogg'): Promise<string> {
    try {
      const extension = mimeType.includes('ogg') ? 'ogg'
        : mimeType.includes('mp4') || mimeType.includes('mpeg') ? 'mp3'
        : 'ogg';

      const file = await toFile(audioBuffer, `voice-note.${extension}`, {
        type: mimeType,
      });

      const response = await this.groq.audio.transcriptions.create({
        file,
        model: 'whisper-large-v3-turbo',
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
