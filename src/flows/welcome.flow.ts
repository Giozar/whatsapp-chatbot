import { addKeyword, EVENTS } from '@builderbot/bot';
import { GroqService } from '../services/groq';
// import { ChatGPTService } from '~/services/openai';

export const welcomeFlow = addKeyword(EVENTS.WELCOME).addAction(
  async (ctx, { flowDynamic, state }) => {
    try {
      const conversationHistory = state.getMyState()?.history ?? [];
      const username = ctx?.pushName ?? 'Usuario';

      console.log(username);

      // Añadir el mensaje del usuario al historial
      conversationHistory.push({
        role: 'user',
        content: ctx.body,
      });

      console.log(conversationHistory);

      // Llamamos a servicio de AI
      const aiResponse = await GroqService({
        username,
        history: conversationHistory,
      });

      // Partimos respuesta en chunks
      const chunks = aiResponse.split(/(?<!\d)\.\s+/g);
      const delay = Math.floor(Math.random() * (15000 - 3000 + 1)) + 3000;

      setTimeout(async () => {
        for (const chunk of chunks) {
          await flowDynamic(chunk);
        }

        // Añadimos la respuesta de la IA al historial
        conversationHistory.push({
          role: 'system',
          content: aiResponse,
        });

        // Guardamos en el state
        await state.update({ history: conversationHistory });
      }, delay);
    } catch (error) {
      console.error('[Error en welcomeFlow]', error);
    }
  }
);
