import { ConversationService } from '~/features/chat/services/conversation.service';
import { HistorySummarizer } from '~/features/chat/services/history-summarizer.service';
import { createLLMService } from '~/features/llm/factories/llm.factory';
import { createVisionService } from '~/features/llm/factories/vision.factory';

export const createConversationService = (): ConversationService => {
    const llmService = createLLMService();
    const visionService = createVisionService();
    const summarizer = new HistorySummarizer(llmService);
    return new ConversationService(llmService, visionService, undefined, summarizer);
};
