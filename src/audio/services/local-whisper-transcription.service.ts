// audio/services/local-whisper-transcription.service.ts

import { pipeline, env, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers';
import { OggOpusDecoder } from 'ogg-opus-decoder';
import { join } from 'path';
import type { ITranscriptionService } from '~/audio/interfaces/transcription.interface';

// Los modelos se descargan una sola vez dentro del workspace (storage/ está en .gitignore)
env.cacheDir = join(process.cwd(), 'storage', 'models');

const WHISPER_SAMPLE_RATE = 16000;

export class LocalWhisperTranscriptionService implements ITranscriptionService {
  private transcriber: AutomaticSpeechRecognitionPipeline | null = null;

  constructor(
    private readonly modelName = process.env.WHISPER_MODEL ?? 'Xenova/whisper-small'
  ) {}

  async transcribe(audioBuffer: Buffer, _mimeType = 'audio/ogg'): Promise<string> {
    try {
      const audio = await this.decodeToMono16k(audioBuffer);
      const transcriber = await this.getTranscriber();

      const result = await transcriber(audio, {
        language: 'spanish',
        task: 'transcribe',
        chunk_length_s: 30,
      });

      const text = Array.isArray(result) ? result[0]?.text ?? '' : result.text;
      return text.trim();
    } catch (error) {
      console.error('[LocalWhisperTranscriptionService] Error transcribing audio:', error);
      throw error;
    }
  }

  // El pipeline se carga de forma lazy: la primera transcripción descarga el modelo
  private async getTranscriber(): Promise<AutomaticSpeechRecognitionPipeline> {
    if (!this.transcriber) {
      console.log(`[LocalWhisper] Cargando modelo ${this.modelName}...`);
      this.transcriber = await pipeline('automatic-speech-recognition', this.modelName, {
        dtype: 'q8',
      });
      console.log('[LocalWhisper] Modelo listo.');
    }
    return this.transcriber;
  }

  // WhatsApp envía OGG/Opus a 48kHz; Whisper espera PCM mono a 16kHz
  private async decodeToMono16k(audioBuffer: Buffer): Promise<Float32Array> {
    const decoder = new OggOpusDecoder();
    await decoder.ready;

    try {
      const { channelData, sampleRate } = await decoder.decodeFile(new Uint8Array(audioBuffer));
      const mono = this.toMono(channelData);
      return this.downsample(mono, sampleRate, WHISPER_SAMPLE_RATE);
    } finally {
      decoder.free();
    }
  }

  private toMono(channelData: Float32Array[]): Float32Array {
    if (channelData.length === 1) return channelData[0];

    const mono = new Float32Array(channelData[0].length);
    for (let i = 0; i < mono.length; i++) {
      let sum = 0;
      for (const channel of channelData) sum += channel[i];
      mono[i] = sum / channelData.length;
    }
    return mono;
  }

  private downsample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate) return input;

    const factor = fromRate / toRate; // 48000 / 16000 = 3
    const output = new Float32Array(Math.floor(input.length / factor));

    // Promedio por bloque: decimación simple con filtrado básico, suficiente para voz
    for (let i = 0; i < output.length; i++) {
      const start = Math.floor(i * factor);
      const end = Math.min(Math.floor((i + 1) * factor), input.length);
      let sum = 0;
      for (let j = start; j < end; j++) sum += input[j];
      output[i] = sum / (end - start);
    }
    return output;
  }
}
