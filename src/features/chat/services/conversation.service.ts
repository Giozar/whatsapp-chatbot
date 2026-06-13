import type { ChatMessage } from '~/features/chat/types/chat-message';
import { MessageBuilder } from '~/features/chat/builders/message.builder';
import type { ILLMService } from '~/features/llm/interfaces/llm-service.interface';

export interface ConversationReplyInput {
    username: string;
    incomingText: string;
    history: ChatMessage[];
}

export interface ConversationReplyResult {
    response: string;
    history: ChatMessage[];
}

export class ConversationService {
    constructor(
        private readonly llmService: ILLMService,
        private readonly messageBuilder = new MessageBuilder()
    ) {}

    async generateReply({
        username,
        incomingText,
        history,
    }: ConversationReplyInput): Promise<ConversationReplyResult> {
        const nextHistory: ChatMessage[] = [
            ...history,
            {
                role: 'user',
                content: incomingText,
            },
        ];

        const messages = this.messageBuilder.buildMessages(nextHistory);
        const response = await this.llmService.generateResponse({ username, messages });

        return {
            response,
            history: [
                ...nextHistory,
                {
                    role: 'assistant',
                    content: response,
                },
            ],
        };
    }
}

