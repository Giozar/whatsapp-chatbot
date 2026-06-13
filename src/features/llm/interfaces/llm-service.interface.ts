import type { ChatMessage } from '~/features/chat/types/chat-message';
import type { MediaInput } from '~/features/media/interfaces/vision-service.interface';

export interface GenerateResponseInput {
    username: string;
    messages: ChatMessage[];
}

export interface GenerateVisionResponseInput extends GenerateResponseInput {
    media: MediaInput;
}

export interface ILLMService {
    generateResponse(input: GenerateResponseInput): Promise<string>;
    generateVisionResponse(input: GenerateVisionResponseInput): Promise<string>;
}
