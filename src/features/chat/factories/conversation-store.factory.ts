import type { IConversationStore } from '~/features/chat/interfaces/conversation-store.interface';
import { FileConversationStore } from '~/features/chat/services/file-conversation-store.service';

export const createConversationStore = (): IConversationStore => {
    // Hoy solo existe el backend de archivo. Futuro: 'memory' | 'db' segun
    // appConfig.chat.persistence.store, sin tocar a los consumidores.
    return new FileConversationStore();
};
