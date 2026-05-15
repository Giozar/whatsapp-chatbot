// services/ollama.service.ts

import { Ollama } from 'ollama';
import { AI_MODEL_CONFIG } from '~/configs/model.config';
import { MessageBuilder } from '~/ai/message.builder';
import type { ChatMessage } from '~/types/chat-message';

const ollama = new Ollama({ host: 'http://localhost:11434' });

const messageBuilder = new MessageBuilder();

export const OllamaService = async ({
  username,
  history,
}: {
  username: string;
  history: ChatMessage[];
}) => {
  try {
    const messages = messageBuilder.buildMessages(history);

    const completion = await ollama.chat({
      model: AI_MODEL_CONFIG.model,
      messages: messages,
    });

    return completion.message.content;
  } catch (error) {
    console.error('[Error en OllamaService]', error);
    return 'tuve un problema al responder';
  }
};