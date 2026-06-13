import { isAbsolute, resolve } from 'path';

export type LLMMode = 'local' | 'cloud';
export type VoiceMode = 'local' | 'cloud';
export type LLMProvider = 'ollama' | 'openai' | 'groq';
export type TranscriptionProvider = 'local' | 'groq';

type ProviderOptions<T extends string> = readonly T[];

const toAbsolutePath = (value: string): string =>
    isAbsolute(value) ? value : resolve(process.cwd(), value);

const readEnv = (name: string): string | undefined => {
    const value = process.env[name]?.trim();
    return value ? value : undefined;
};

const requireEnv = (name: string, reason: string): string => {
    const value = readEnv(name);
    if (!value) {
        throw new Error(`[config] Missing ${name}: ${reason}`);
    }
    return value;
};

const parseBoolean = (name: string, defaultValue: boolean): boolean => {
    const value = readEnv(name);
    if (value === undefined) return defaultValue;
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw new Error(`[config] Invalid ${name}: expected "true" or "false", received "${value}"`);
};

const parseNumber = (name: string, defaultValue: number): number => {
    const value = readEnv(name);
    if (value === undefined) return defaultValue;

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
        throw new Error(`[config] Invalid ${name}: expected a number, received "${value}"`);
    }

    return parsed;
};

const parseValue = <T extends string>(
    name: string,
    options: ProviderOptions<T>,
    defaultValue: T
): T => {
    const value = readEnv(name);
    if (value === undefined) return defaultValue;

    if (options.includes(value as T)) {
        return value as T;
    }

    throw new Error(
        `[config] Invalid ${name}: expected one of ${options.join(', ')}, received "${value}"`
    );
};

const llmMode = parseValue('LLM_MODE', ['local', 'cloud'], 'local');
const voiceMode = parseValue('VOICE_MODE', ['local', 'cloud'], 'local');

const explicitLLMProvider = readEnv('LLM_PROVIDER');
const explicitTranscriptionProvider = readEnv('TRANSCRIPTION_PROVIDER');

const llmProvider =
    llmMode === 'local'
        ? 'ollama'
        : parseValue('LLM_PROVIDER', ['openai', 'groq'], 'openai');

const transcriptionProvider =
    voiceMode === 'local'
        ? 'local'
        : parseValue('TRANSCRIPTION_PROVIDER', ['groq'], 'groq');

if (llmMode === 'local' && explicitLLMProvider && explicitLLMProvider !== 'ollama') {
    throw new Error('[config] LLM_PROVIDER must be "ollama" when LLM_MODE=local');
}

if (
    voiceMode === 'local' &&
    explicitTranscriptionProvider &&
    explicitTranscriptionProvider !== 'local'
) {
    throw new Error('[config] TRANSCRIPTION_PROVIDER must be "local" when VOICE_MODE=local');
}

const ollamaModel = readEnv('OLLAMA_MODEL') ?? readEnv('AI_MODEL') ?? 'llama3.2:latest';
const ollamaHost = readEnv('OLLAMA_HOST') ?? 'http://localhost:11434';
const openaiModel = readEnv('OPENAI_MODEL');
const openaiApiKey = readEnv('OPENAI_API_KEY');
const groqModel = readEnv('GROQ_MODEL');
const groqApiKey = readEnv('GROQ_API_KEY');
const groqTranscriptionModel =
    readEnv('GROQ_TRANSCRIPTION_MODEL') ?? 'whisper-large-v3-turbo';
const visionEnabled = parseBoolean('VISION_ENABLED', false);
const visionModelMultimodal = parseBoolean('VISION_MODEL_MULTIMODAL', true);
const visionUseTextModel = parseBoolean('VISION_USE_TEXT_MODEL', true);
const ollamaVisionModel = readEnv('OLLAMA_VISION_MODEL');
const openaiVisionModel = readEnv('OPENAI_VISION_MODEL');
const groqVisionModel = readEnv('GROQ_VISION_MODEL');

if (visionEnabled && !visionModelMultimodal) {
    throw new Error(
        '[config] VISION_MODEL_MULTIMODAL must be "true" when VISION_ENABLED=true'
    );
}

if (llmMode === 'cloud' && llmProvider === 'openai') {
    requireEnv('OPENAI_API_KEY', 'required when LLM_MODE=cloud and LLM_PROVIDER=openai');
    requireEnv('OPENAI_MODEL', 'required when LLM_MODE=cloud and LLM_PROVIDER=openai');
}

if (llmMode === 'cloud' && llmProvider === 'groq') {
    requireEnv('GROQ_API_KEY', 'required when LLM_MODE=cloud and LLM_PROVIDER=groq');
    requireEnv('GROQ_MODEL', 'required when LLM_MODE=cloud and LLM_PROVIDER=groq');
}

if (voiceMode === 'cloud') {
    requireEnv('GROQ_API_KEY', 'required when VOICE_MODE=cloud');
    requireEnv('GROQ_TRANSCRIPTION_MODEL', 'required when VOICE_MODE=cloud');
}

if (visionEnabled && !visionUseTextModel) {
    if (llmMode === 'local') {
        requireEnv(
            'OLLAMA_VISION_MODEL',
            'required when VISION_ENABLED=true, LLM_MODE=local and VISION_USE_TEXT_MODEL=false'
        );
    }

    if (llmMode === 'cloud' && llmProvider === 'openai') {
        requireEnv(
            'OPENAI_VISION_MODEL',
            'required when VISION_ENABLED=true, LLM_MODE=cloud, LLM_PROVIDER=openai and VISION_USE_TEXT_MODEL=false'
        );
    }

    if (llmMode === 'cloud' && llmProvider === 'groq') {
        requireEnv(
            'GROQ_VISION_MODEL',
            'required when VISION_ENABLED=true, LLM_MODE=cloud, LLM_PROVIDER=groq and VISION_USE_TEXT_MODEL=false'
        );
    }
}

export const appConfig = {
    server: {
        port: parseNumber('PORT', 3008),
    },
    chat: {
        history: {
            summaryEnabled: parseBoolean('HISTORY_SUMMARY_ENABLED', true),
            maxMessages: parseNumber('HISTORY_MAX_MESSAGES', 20),
            keepRecentMessages: parseNumber('HISTORY_KEEP_RECENT', 8),
            logHistory: parseBoolean('HISTORY_LOG_ENABLED', true),
        },
    },
    llm: {
        mode: llmMode,
        provider: llmProvider as LLMProvider,
        usesModelfile: parseBoolean('USES_MODELFILE', false),
        local: {
            provider: 'ollama' as const,
            host: ollamaHost,
            model: ollamaModel,
            legacyModelEnv: readEnv('AI_MODEL'),
        },
        cloud: {
            provider: llmProvider === 'ollama' ? null : llmProvider,
            openai: {
                apiKey: openaiApiKey,
                model: openaiModel,
            },
            groq: {
                apiKey: groqApiKey,
                model: groqModel,
            },
        },
    },
    voice: {
        mode: voiceMode,
        provider: transcriptionProvider as TranscriptionProvider,
        local: {
            provider: 'local' as const,
            model: readEnv('WHISPER_MODEL') ?? 'Xenova/whisper-small',
            modelCacheDir: toAbsolutePath(readEnv('MODEL_CACHE_DIR') ?? 'storage/models'),
        },
        cloud: {
            provider: 'groq' as const,
            apiKey: groqApiKey,
            model: groqTranscriptionModel,
        },
        storage: {
            audioDir: toAbsolutePath(readEnv('AUDIO_STORAGE_DIR') ?? 'storage/audios'),
        },
    },
    vision: {
        enabled: visionEnabled,
        modelMultimodal: visionModelMultimodal,
        useTextModel: visionUseTextModel,
        local: {
            provider: 'ollama' as const,
            model: ollamaVisionModel,
        },
        cloud: {
            provider: llmProvider === 'ollama' ? null : llmProvider,
            openai: {
                model: openaiVisionModel,
            },
            groq: {
                model: groqVisionModel,
            },
        },
        storage: {
            mediaDir: toAbsolutePath(readEnv('MEDIA_STORAGE_DIR') ?? 'storage/media'),
        },
    },
    reply: {
        minDelayMs: parseNumber('REPLY_MIN_DELAY_MS', 3000),
        maxDelayMs: parseNumber('REPLY_MAX_DELAY_MS', 15000),
    },
} as const;

if (appConfig.reply.minDelayMs > appConfig.reply.maxDelayMs) {
    throw new Error('[config] REPLY_MIN_DELAY_MS must be less than or equal to REPLY_MAX_DELAY_MS');
}

if (appConfig.chat.history.keepRecentMessages >= appConfig.chat.history.maxMessages) {
    throw new Error('[config] HISTORY_KEEP_RECENT must be less than HISTORY_MAX_MESSAGES');
}
