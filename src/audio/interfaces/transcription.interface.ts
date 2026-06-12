// services/transcription.interface.ts

export interface ITranscriptionService {
  transcribe(audioBuffer: Buffer, mimeType?: string): Promise<string>;
}
