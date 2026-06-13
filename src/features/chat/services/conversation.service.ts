import type { ChatMessage } from '~/features/chat/types/chat-message';
import { MessageBuilder } from '~/features/chat/builders/message.builder';
import type { ILLMService } from '~/features/llm/interfaces/llm-service.interface';
import { HistorySummarizer } from '~/features/chat/services/history-summarizer.service';
import { appConfig } from '~/shared/config/app-config';

export interface ConversationReplyInput {
    username: string;
    incomingText: string;
    history: ChatMessage[];
    summary?: string;
}

export interface ConversationReplyResult {
    response: string;
    history: ChatMessage[];
    summary?: string;
    didSummarize: boolean;
}

export class ConversationService {
    constructor(
        private readonly llmService: ILLMService,
        private readonly messageBuilder = new MessageBuilder(),
        private readonly summarizer = new HistorySummarizer(llmService)
    ) {}

    async generateReply({
        username,
        incomingText,
        history,
        summary,
    }: ConversationReplyInput): Promise<ConversationReplyResult> {
        const historyWithUser: ChatMessage[] = [
            ...history,
            { role: 'user', content: incomingText },
        ];

        const messages = this.messageBuilder.buildMessages(historyWithUser, summary);
        const response = await this.llmService.generateResponse({ username, messages });

        const fullHistory: ChatMessage[] = [
            ...historyWithUser,
            { role: 'assistant', content: response },
        ];

        const { maxMessages, keepRecentMessages, summaryEnabled } = appConfig.chat.history;

        if (summaryEnabled && fullHistory.length > maxMessages) {
            const older = fullHistory.slice(0, fullHistory.length - keepRecentMessages);
            const recent = fullHistory.slice(fullHistory.length - keepRecentMessages);

            const nextSummary = await this.summarizer.summarize({
                previousSummary: summary,
                messages: older,
            });

            return {
                response,
                history: recent,
                summary: nextSummary,
                didSummarize: true,
            };
        }

        return {
            response,
            history: fullHistory,
            summary,
            didSummarize: false,
        };
    }
}
