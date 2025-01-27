// services/openai.ts

import { OpenAI } from 'openai';
import { AgentResponse } from '../../prompts/AgentReponse';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const ChatGPTService = async ({ username, history }) => {
  const agent = new AgentResponse();
  // Si no hay mensajes anteriores en el historial
  agent.setFirst(history.length === 1);

  // Construimos el mensaje de sistema
  const systemMessage = {
    role: 'system',
    content: agent.generateSystemMessage(username),
  };

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo', 
    messages: [systemMessage, ...history],
  });

  return completion.choices[0].message?.content || '';
};
