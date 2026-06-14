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

        if (appConfig.llm.usesModelfile) {
            return this.foldContextIntoLastUserMessage(history, normalizedUsername, summary);
        }

        const messages: ChatMessage[] = [
            { role: 'system', content: this.promptBuilder.buildSystemPrompt(normalizedUsername) },
        ];

        if (summary) {
            messages.push({
                role: 'system',
                content: `Resumen de la conversación previa:\n${summary}`,
            });
        }

        messages.push(...history);

        return messages;
    }

    private foldContextIntoLastUserMessage(
        history: ChatMessage[],
        username: string,
        summary?: string
    ): ChatMessage[] {
        const lastUserIndex = history.reduce(
            (found, msg, i) => (msg.role === 'user' ? i : found),
            -1
        );

        const preamble = this.buildModelfilePreamble(username, summary);

        if (lastUserIndex === -1) {
            return [{ role: 'user', content: preamble }, ...history];
        }

        return history.map((msg, i) => {
            if (i !== lastUserIndex) return msg;
            return { ...msg, content: `${preamble}${msg.content}` };
        });
    }

    private buildModelfilePreamble(username: string, summary?: string): string {
        const summaryLine = summary ? `Resumen previo: ${summary}\n` : '';
        return `Contexto: hablas con ${username}.\n${summaryLine}Usa estos datos solo si se siente natural.\n\n`;
    }

    private normalizeUsername(username?: string): string {
        const value = username?.trim();
        return value ? value : 'Usuario';
    }
}
