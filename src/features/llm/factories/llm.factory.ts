import type { ILLMService } from '~/features/llm/interfaces/llm-service.interface';
import { GroqLLMService } from '~/features/llm/services/groq-llm.service';
import { OllamaLLMService } from '~/features/llm/services/ollama-llm.service';
import { OpenAILLMService } from '~/features/llm/services/openai-llm.service';
import { appConfig } from '~/shared/config/app-config';

export const createLLMService = (): ILLMService => {
    switch (appConfig.llm.mode === 'local' ? 'ollama' : appConfig.llm.provider) {
        case 'openai':
            return new OpenAILLMService();
        case 'groq':
            return new GroqLLMService();
        case 'ollama':
            return new OllamaLLMService();
        default:
            throw new Error(`Unsupported LLM provider: ${appConfig.llm.provider as string}`);
    }
};
