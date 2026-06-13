import { OpenAI } from 'openai';
import type { GenerateResponseInput, ILLMService } from '~/features/llm/interfaces/llm-service.interface';
import { appConfig } from '~/shared/config/app-config';

export class OpenAILLMService implements ILLMService {
    private readonly client = new OpenAI({
        apiKey: appConfig.llm.cloud.openai.apiKey,
    });

    async generateResponse({ messages }: GenerateResponseInput): Promise<string> {
        try {
            const completion = await this.client.chat.completions.create({
                model: appConfig.llm.cloud.openai.model!,
                messages,
            });

            return completion.choices[0].message?.content ?? '';
        } catch (error) {
            console.error('[OpenAILLMService] Error generating response:', error);
            return 'tuve un problema al responder';
        }
    }
}
