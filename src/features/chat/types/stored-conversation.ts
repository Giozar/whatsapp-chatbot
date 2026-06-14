import type { ChatMessage } from '~/features/chat/types/chat-message';

export type ConversationStatus = 'new' | 'continuing';

export interface StoredConversation {
    version: number; // esquema, para migraciones futuras
    userId: string;
    username: string;
    history: ChatMessage[];
    summary?: string;
    createdAt: number; // epoch ms
    lastInteractionAt: number; // epoch ms — base de futuras heuristicas
    messageCount: number; // total acumulado (observabilidad/futuro)
}
