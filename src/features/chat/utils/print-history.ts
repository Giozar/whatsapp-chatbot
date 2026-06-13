import type { ChatMessage } from '~/features/chat/types/chat-message';
import { appConfig } from '~/shared/config/app-config';

interface PrintHistoryOptions {
    userId: string;
    username: string;
    history: ChatMessage[];
    summary?: string;
    didSummarize: boolean;
}

export const printConversationHistory = ({
    userId,
    username,
    history,
    summary,
    didSummarize,
}: PrintHistoryOptions): void => {
    if (!appConfig.chat.history.logHistory) return;

    const separator = '─'.repeat(60);
    const lines: string[] = [
        separator,
        `[historial] usuario: ${username} (${userId})`,
        `[historial] mensajes en memoria: ${history.length}`,
    ];

    if (didSummarize) {
        lines.push('[historial] resumen aplicado en este turno');
    }

    if (summary) {
        lines.push(`[historial] resumen acumulado: ${summary}`);
    }

    lines.push('');
    for (const msg of history) {
        lines.push(`  [${msg.role}] ${msg.content}`);
    }

    lines.push(separator);
    console.log(lines.join('\n'));
};
