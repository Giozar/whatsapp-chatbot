import type { ChatMessage } from '~/features/chat/types/chat-message';

export interface GenerateResponseInput {
    username: string;
    messages: ChatMessage[];
}

export interface ILLMService {
    generateResponse(input: GenerateResponseInput): Promise<string>;
}

