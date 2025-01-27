import { Groq } from 'groq-sdk';
import { AgentResponse } from '../../prompts/AgentReponse';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const GroqService = async ({
  username,
  history,
}) => {
  try {
    const agent = new AgentResponse();

    // Si no hay mensajes anteriores en el historial
    agent.setFirst(history.length === 0);

    const systemMessage = {
      role: 'system',
      content: agent.generateSystemMessage(username),
    };

    const messages = [systemMessage, ...history];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
    });

    const response = completion.choices[0].message.content;
    return response;
  } catch (error) {
    console.error('[Error en GroqService]', error);
    return 'Lo siento, hubo un error al procesar tu mensaje.';
  }
};
