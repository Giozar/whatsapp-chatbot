import { Ollama } from 'ollama';
import type { Message } from 'ollama';
import type {
    GenerateResponseInput,
    GenerateVisionResponseInput,
    ILLMService,
} from '~/features/llm/interfaces/llm-service.interface';
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

    async generateVisionResponse({
        messages,
        media,
    }: GenerateVisionResponseInput): Promise<string> {
        try {
            const lastUserIndex = this.findLastUserMessageIndex(messages);
            const visionMessages: Message[] = messages.map((message, index) => ({
                ...message,
                ...(index === lastUserIndex ? { images: [media.base64] } : {}),
            }));

            const completion = await this.client.chat({
                model: this.getVisionModel(),
                messages: visionMessages,
            });

            return completion.message.content;
        } catch (error) {
            console.error('[OllamaLLMService] Error generating vision response:', error);
            return this.getVisionFallback(media.kind);
        }
    }

    private getVisionModel(): string {
        if (appConfig.vision.useTextModel) {
            return appConfig.llm.local.model;
        }

        return appConfig.vision.local.model!;
    }

    private getVisionFallback(kind: GenerateVisionResponseInput['media']['kind']): string {
        if (kind === 'sticker') {
            return 'no pude interpretar ese sticker, puedes mandarlo como imagen?';
        }

        return 'tuve un problema interpretando la imagen';
    }

    private findLastUserMessageIndex(messages: GenerateResponseInput['messages']): number {
        for (let index = messages.length - 1; index >= 0; index -= 1) {
            if (messages[index].role === 'user') return index;
        }

        return messages.length - 1;
    }
}
