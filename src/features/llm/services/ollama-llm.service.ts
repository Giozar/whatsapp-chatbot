import { Ollama } from 'ollama';
import type { GenerateResponseInput, ILLMService } from '~/features/llm/interfaces/llm-service.interface';
import { appConfig } from '~/shared/config/app-config';

export class OllamaLLMService implements ILLMService {
    private readonly client = new Ollama({ host: appConfig.llm.local.host });

    async generateResponse({ messages }: GenerateResponseInput): Promise<string> {
        try {
            const completion = await this.client.chat({
                model: appConfig.llm.local.model,
                messages,
            });

            return completion.message.content;
        } catch (error) {
            console.error('[OllamaLLMService] Error generating response:', error);
            return 'tuve un problema al responder';
        }
    }
}
