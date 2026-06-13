import type { ChatMessage } from '~/features/chat/types/chat-message';
import type { ILLMService } from '~/features/llm/interfaces/llm-service.interface';

interface SummarizeInput {
    previousSummary?: string;
    messages: ChatMessage[];
}

export class HistorySummarizer {
    constructor(private readonly llmService: ILLMService) {}

    async summarize({ previousSummary, messages }: SummarizeInput): Promise<string> {
        const contextParts: string[] = [];

        if (previousSummary) {
            contextParts.push(`Resumen previo:\n${previousSummary}`);
        }

        const conversation = messages
            .map((m) => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`)
            .join('\n');

        contextParts.push(`Conversación:\n${conversation}`);

        const prompt = `Resume de forma concisa la siguiente conversación, integrando el resumen previo si existe. Incluye los puntos clave, temas tratados y cualquier información relevante del usuario. El resumen debe ser en español y no superar 3 oraciones.\n\n${contextParts.join('\n\n')}`;

        return this.llmService.generateResponse({
            username: 'system',
            messages: [{ role: 'user', content: prompt }],
        });
    }
}
