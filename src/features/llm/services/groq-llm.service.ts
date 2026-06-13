import { Groq } from 'groq-sdk';
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions';
import type {
    GenerateResponseInput,
    GenerateVisionResponseInput,
    ILLMService,
} from '~/features/llm/interfaces/llm-service.interface';
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

    async generateVisionResponse({
        messages,
        media,
    }: GenerateVisionResponseInput): Promise<string> {
        try {
            const completion = await this.client.chat.completions.create({
                model: this.getVisionModel(),
                messages: this.buildVisionMessages(messages, media),
            });

            return completion.choices[0].message.content ?? '';
        } catch (error) {
            console.error('[GroqLLMService] Error generating vision response:', error);
            return this.getVisionFallback(media.kind);
        }
    }

    private getVisionModel(): string {
        if (appConfig.vision.useTextModel) {
            return appConfig.llm.cloud.groq.model!;
        }

        return appConfig.vision.cloud.groq.model!;
    }

    private buildVisionMessages(
        messages: GenerateResponseInput['messages'],
        media: GenerateVisionResponseInput['media']
    ): ChatCompletionMessageParam[] {
        const lastUserIndex = this.findLastUserMessageIndex(messages);
        const dataUrl = `data:${media.mimeType};base64,${media.base64}`;

        return messages.map((message, index) => {
            if (index !== lastUserIndex) {
                return message as ChatCompletionMessageParam;
            }

            return {
                role: 'user',
                content: [
                    { type: 'text', text: message.content },
                    { type: 'image_url', image_url: { url: dataUrl } },
                ],
            };
        });
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
