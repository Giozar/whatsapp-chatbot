import type { ILLMService } from '~/features/llm/interfaces/llm-service.interface';
import { createLLMService } from '~/features/llm/factories/llm.factory';
import { OllamaLLMService } from '~/features/llm/services/ollama-llm.service';
import { OpenAILLMService } from '~/features/llm/services/openai-llm.service';
import { GroqLLMService } from '~/features/llm/services/groq-llm.service';
import { appConfig } from '~/shared/config/app-config';

export const createVisionService = (): ILLMService | null => {
    const v = appConfig.vision;

    if (!v.enabled) return null;
    if (v.useActiveModel) return createLLMService();

    if (v.mode === 'local') {
        return new OllamaLLMService({ model: v.local!.model, host: v.local!.host });
    }

    const cloud = v.cloud!;
    if (cloud.provider === 'openai') {
        return new OpenAILLMService({ model: cloud.model, apiKey: cloud.apiKey });
    }

    return new GroqLLMService({ model: cloud.model, apiKey: cloud.apiKey });
};
