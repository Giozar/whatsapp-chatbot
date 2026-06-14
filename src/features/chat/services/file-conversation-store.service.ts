import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import type { IConversationStore } from '~/features/chat/interfaces/conversation-store.interface';
import type { StoredConversation } from '~/features/chat/types/stored-conversation';
import { appConfig } from '~/shared/config/app-config';

export class FileConversationStore implements IConversationStore {
    private readonly cache = new Map<string, StoredConversation>();

    constructor(private readonly baseDir = appConfig.chat.persistence.storageDir) {}

    async load(userId: string): Promise<StoredConversation | null> {
        const cached = this.cache.get(userId);
        if (cached) return cached;

        try {
            const raw = await readFile(this.filePath(userId), 'utf-8');
            const parsed = JSON.parse(raw) as StoredConversation;
            this.cache.set(userId, parsed);
            return parsed;
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                return null;
            }
            console.error(
                `[FileConversationStore] No se pudo leer el historial de ${userId}, se trata como nuevo:`,
                error
            );
            return null;
        }
    }

    async save(conversation: StoredConversation): Promise<void> {
        this.cache.set(conversation.userId, conversation);

        await mkdir(this.baseDir, { recursive: true });
        await writeFile(
            this.filePath(conversation.userId),
            JSON.stringify(conversation, null, 2),
            'utf-8'
        );
    }

    private filePath(userId: string): string {
        return join(this.baseDir, `${this.sanitize(userId)}.json`);
    }

    private sanitize(value: string): string {
        return value.replace(/[^a-zA-Z0-9_-]/g, '');
    }
}
