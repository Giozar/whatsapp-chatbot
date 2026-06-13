import { appConfig } from '~/shared/config/app-config';
import type { ChatMessage } from '~/features/chat/types/chat-message';
import { PromptBuilder } from '~/features/chat/builders/prompt.builder';

export class MessageBuilder {
    constructor(private readonly promptBuilder = new PromptBuilder()) {}

    buildMessages(history: ChatMessage[]): ChatMessage[] {
        if (appConfig.llm.usesModelfile) {
            return history;
        }

        return [
            {
                role: 'system',
                content: this.promptBuilder.buildSystemPrompt(),
            },
            ...history,
        ];
    }
}

