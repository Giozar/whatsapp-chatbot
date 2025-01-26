const BotWhatsapp = require('@bot-whatsapp/bot');
const groq = require('../services/groq');
const AgentReponse = require('../prompts/agentReponse');

const agentReponse = new AgentReponse();

const welcomeFlow = BotWhatsapp.addKeyword(BotWhatsapp.EVENTS.WELCOME)
  .addAction(async (ctx, { flowDynamic, state }) => {
    try {
      const newHistory = state.getMyState()?.history ?? [];
      const username = ctx?.pushName ?? 'Usuario';

      newHistory.push({
        role: 'user',
        content: ctx.body
      });

      /* console.log('[Historial]: ', newHistory);
      console.log('[Mensaje Entrante]: ', ctx.body); */

      const agentResponse = agentReponse.generateResponse(username, ctx.body);
      agentReponse.setFirst(false);
      const ai = await groq(agentResponse);

      // Divide el texto en fragmentos de texto de acuerdo a los puntos y saltos de línea: 
      const chunks = ai.split(/(?<!\d)\.\s+/g);

      // Genera un retraso aleatorio entre 3 y 15 segundos
      const delay = Math.floor(Math.random() * (15000 - 3000 + 1)) + 3000;

      setTimeout(async () => {
        for (const chunk of chunks) {
          await flowDynamic(chunk);
        }

        newHistory.push({
          role: 'assistant',
          content: ai
        });

        await state.update({ hsitory: newHistory });
      }, delay);

    } catch (error) {
      console.log(error);
    }
  })

module.exports = welcomeFlow