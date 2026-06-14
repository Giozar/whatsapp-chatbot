import { ConversationStateManager } from '~/features/chat/services/conversation-state.manager';
import { createConversationStore } from '~/features/chat/factories/conversation-store.factory';
import { appConfig } from '~/shared/config/app-config';

export const createConversationStateManager = (): ConversationStateManager => {
    const { enabled, restoreMessages } = appConfig.chat.persistence;
    const store = enabled ? createConversationStore() : null;
    return new ConversationStateManager(store, restoreMessages);
};
