import type { StoredConversation } from '~/features/chat/types/stored-conversation';

export interface IConversationStore {
    load(userId: string): Promise<StoredConversation | null>;
    save(conversation: StoredConversation): Promise<void>;
}
