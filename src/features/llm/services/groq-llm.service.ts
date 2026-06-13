import { Groq } from 'groq-sdk';
import type { GenerateResponseInput, ILLMService } from '~/features/llm/interfaces/llm-service.interface';
import { appConfig } from '~/shared/config/app-config';

export class GroqLLMService implements ILLMService {
    private readonly client = new Groq({
        apiKey: appConfig.llm.cloud.groq.apiKey,
    });

    async generateResponse({ messages }: GenerateResponseInput): Promise<string> {
        try {
            const completion = await this.client.chat.completions.create({
                model: appConfig.llm.cloud.groq.model!,
                messages,
            });

            return completion.choices[0].message.content ?? '';
        } catch (error) {
            console.error('[GroqLLMService] Error generating response:', error);
            return 'tuve un problema al responder';
        }
    }
}
