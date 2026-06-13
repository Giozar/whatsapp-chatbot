import { appConfig } from '~/shared/config/app-config';
import type { ChatMessage } from '~/features/chat/types/chat-message';
import { PromptBuilder } from '~/features/chat/builders/prompt.builder';

export class MessageBuilder {
    constructor(private readonly promptBuilder = new PromptBuilder()) {}

    buildMessages(history: ChatMessage[], summary?: string): ChatMessage[] {
        const summaryMessage: ChatMessage | null = summary
            ? { role: 'system', content: `Resumen de la conversación previa:\n${summary}` }
            : null;

        if (appConfig.llm.usesModelfile) {
            return summaryMessage ? [summaryMessage, ...history] : history;
        }

        const messages: ChatMessage[] = [
            { role: 'system', content: this.promptBuilder.buildSystemPrompt() },
        ];

        if (summaryMessage) messages.push(summaryMessage);
        messages.push(...history);

        return messages;
    }
}

