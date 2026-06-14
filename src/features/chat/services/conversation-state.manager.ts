import type { ChatMessage } from '~/features/chat/types/chat-message';
import type { IConversationStore } from '~/features/chat/interfaces/conversation-store.interface';
import type {
    ConversationStatus,
    StoredConversation,
} from '~/features/chat/types/stored-conversation';

export interface ConversationContext {
    history: ChatMessage[];
    summary?: string;
    status: ConversationStatus;
    stored: StoredConversation | null;
}

export interface PersistConversationInput {
    userId: string;
    username: string;
    history: ChatMessage[];
    summary?: string;
    stored: StoredConversation | null;
}

export class ConversationStateManager {
    constructor(
        private readonly store: IConversationStore | null,
        private readonly restoreMessages: number
    ) {}

    async load(userId: string): Promise<ConversationContext> {
        if (!this.store) {
            return { history: [], summary: undefined, status: 'new', stored: null };
        }

        const stored = await this.store.load(userId);
        const history = stored ? stored.history.slice(-this.restoreMessages) : [];

        return {
            history,
            summary: stored?.summary,
            status: this.evaluateStatus(stored),
            stored,
        };
    }

    async persist({
        userId,
        username,
        history,
        summary,
        stored,
    }: PersistConversationInput): Promise<void> {
        if (!this.store) return;

        const now = Date.now();
        const conversation: StoredConversation = {
            version: 1,
            userId,
            username,
            history,
            summary,
            createdAt: stored?.createdAt ?? now,
            lastInteractionAt: now,
            messageCount: (stored?.messageCount ?? 0) + 1,
        };

        await this.store.save(conversation);
    }

    /**
     * Punto de extension de continuidad. Hoy: si existe un registro previo, la
     * conversacion continua. Futuro: umbral de tiempo sobre lastInteractionAt,
     * deteccion de saludo o de mensaje pendiente.
     */
    private evaluateStatus(stored: StoredConversation | null): ConversationStatus {
        return stored ? 'continuing' : 'new';
    }
}
