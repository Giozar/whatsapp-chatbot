import { appConfig } from '~/shared/config/app-config';
import type { ChatMessage } from '~/features/chat/types/chat-message';
import { PromptBuilder } from '~/features/chat/builders/prompt.builder';

interface BuildMessagesInput {
    history: ChatMessage[];
    username: string;
    summary?: string;
}

export class MessageBuilder {
    constructor(private readonly promptBuilder = new PromptBuilder()) {}

    buildMessages({ history, username, summary }: BuildMessagesInput): ChatMessage[] {
        const normalizedUsername = this.normalizeUsername(username);
        const summaryMessage = summary
            ? this.buildSummaryContext(summary, appConfig.llm.usesModelfile)
            : null;

        if (appConfig.llm.usesModelfile) {
            const contextualMessages: ChatMessage[] = [
                this.buildUserNameContext(normalizedUsername),
            ];

            if (summaryMessage) contextualMessages.push(summaryMessage);
            contextualMessages.push(...history);

            return contextualMessages;
        }

        const messages: ChatMessage[] = [
            { role: 'system', content: this.promptBuilder.buildSystemPrompt(normalizedUsername) },
        ];

        if (summaryMessage) messages.push(summaryMessage);
        messages.push(...history);

        return messages;
    }

    private buildSummaryContext(summary: string, usesModelfile: boolean): ChatMessage {
        if (usesModelfile) {
            return {
                role: 'user',
                content: `Contexto de la conversacion previa:\n${summary}`,
            };
        }

        return {
            role: 'system',
            content: `Resumen de la conversación previa:\n${summary}`,
        };
    }

    private buildUserNameContext(username: string): ChatMessage {
        return {
            role: 'user',
            content:
                `Contexto: el usuario con quien hablas se llama ${username}. ` +
                'Usa este dato solo si se siente natural en la conversacion.',
        };
    }

    private normalizeUsername(username?: string): string {
        const value = username?.trim();
        return value ? value : 'Usuario';
    }
}
