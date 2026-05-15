// services/groq.service.ts

import { Groq } from 'groq-sdk';
import { MessageBuilder } from '~/ai/message.builder';
import type { ChatMessage } from '~/types/chat-message';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const messageBuilder = new MessageBuilder();

export const GroqService = async ({
  username,
  history,
}: {
  username: string;
  history: ChatMessage[];
}) => {
  try {
    const messages = messageBuilder.buildMessages(history);

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
    });

    return completion.choices[0].message.content ?? '';
  } catch (error) {
    console.error('[Error en GroqService]', error);
    return 'tuve un problema al responder';
  }
};