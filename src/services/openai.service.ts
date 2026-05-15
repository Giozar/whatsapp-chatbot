// services/openai.service.ts

import { OpenAI } from 'openai';
import { MessageBuilder } from '~/ai/message.builder';
import type { ChatMessage } from '~/types/chat-message';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const messageBuilder = new MessageBuilder();

export const OpenAIService = async ({
  username,
  history,
}: {
  username: string;
  history: ChatMessage[];
}) => {
  try {
    const messages = messageBuilder.buildMessages(history);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
    });

    return completion.choices[0].message?.content ?? '';
  } catch (error) {
    console.error('[Error en ChatGPTService]', error);
    return 'tuve un problema al responder';
  }
};