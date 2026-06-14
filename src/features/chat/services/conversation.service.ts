import type { ChatMessage } from '~/features/chat/types/chat-message';
import { MessageBuilder } from '~/features/chat/builders/message.builder';
import type { ILLMService } from '~/features/llm/interfaces/llm-service.interface';
import { HistorySummarizer } from '~/features/chat/services/history-summarizer.service';
import { appConfig } from '~/shared/config/app-config';
import type { MediaInput } from '~/features/media/interfaces/vision-service.interface';
import { MediaContextBuilder } from '~/features/media/services/media-context-builder.service';

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

export interface ConversationMediaReplyInput {
    username: string;
    media: MediaInput;
    history: ChatMessage[];
    summary?: string;
}

export class ConversationService {
    constructor(
        private readonly llmService: ILLMService,
        private readonly visionService: ILLMService | null = null,
        private readonly messageBuilder = new MessageBuilder(),
        private readonly summarizer = new HistorySummarizer(llmService),
        private readonly mediaContextBuilder = new MediaContextBuilder()
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

        const messages = this.messageBuilder.buildMessages({
            history: historyWithUser,
            username,
            summary,
        });
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

    async generateMediaReply({
        username,
        media,
        history,
        summary,
    }: ConversationMediaReplyInput): Promise<ConversationReplyResult> {
        const mediaPrompt = this.mediaContextBuilder.buildVisionPrompt(media.kind);
        const messages = this.messageBuilder.buildMessages({
            history: [...history, { role: 'user', content: mediaPrompt }],
            username,
            summary,
        });
        const response = await (this.visionService ?? this.llmService).generateVisionResponse({
            username,
            messages,
            media,
        });

        const mediaHistoryEntry = this.mediaContextBuilder.buildHistoryEntry(
            media.kind,
            response
        );
        const fullHistory: ChatMessage[] = [
            ...history,
            { role: 'user', content: mediaHistoryEntry },
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
