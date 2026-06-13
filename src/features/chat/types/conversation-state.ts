import type { ChatMessage } from '~/features/chat/types/chat-message';

export interface ConversationState {
    history: ChatMessage[];
    summary?: string;
}
