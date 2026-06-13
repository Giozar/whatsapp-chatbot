import { pipeline, env, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers';
import { OggOpusDecoder } from 'ogg-opus-decoder';
import type { ITranscriptionService } from '~/features/voice/interfaces/transcription.interface';
import { appConfig } from '~/shared/config/app-config';

env.cacheDir = appConfig.voice.local.modelCacheDir;

const WHISPER_SAMPLE_RATE = 16000;

export class LocalWhisperTranscriptionService implements ITranscriptionService {
    private transcriber: AutomaticSpeechRecognitionPipeline | null = null;

    constructor(private readonly modelName = appConfig.voice.local.model) {}

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

    private async getTranscriber(): Promise<AutomaticSpeechRecognitionPipeline> {
        if (!this.transcriber) {
            console.log(`[LocalWhisper] Loading model ${this.modelName}...`);
            this.transcriber = await pipeline('automatic-speech-recognition', this.modelName, {
                dtype: 'q8',
            });
            console.log('[LocalWhisper] Model ready.');
        }

        return this.transcriber;
    }

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
        for (let index = 0; index < mono.length; index++) {
            let sum = 0;
            for (const channel of channelData) sum += channel[index];
            mono[index] = sum / channelData.length;
        }

        return mono;
    }

    private downsample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
        if (fromRate === toRate) return input;

        const factor = fromRate / toRate;
        const output = new Float32Array(Math.floor(input.length / factor));

        for (let index = 0; index < output.length; index++) {
            const start = Math.floor(index * factor);
            const end = Math.min(Math.floor((index + 1) * factor), input.length);
            let sum = 0;

            for (let sample = start; sample < end; sample++) sum += input[sample];
            output[index] = sum / (end - start);
        }

        return output;
    }
}
