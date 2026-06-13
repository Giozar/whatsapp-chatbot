import { ConversationService } from '~/features/chat/services/conversation.service';
import { createLLMService } from '~/features/llm/factories/llm.factory';

export const createConversationService = (): ConversationService =>
    new ConversationService(createLLMService());

