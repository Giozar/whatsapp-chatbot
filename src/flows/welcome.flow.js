const BotWhatsapp = require('@bot-whatsapp/bot');
const chatGPT = require('../services/openai');

const welcomeFlow = BotWhatsapp.addKeyword(BotWhatsapp.EVENTS.WELCOME)
    .addAction(async (ctx, { flowDynamic, state }) => {
        try {
            // Obtén el historial del estado actual o inicialízalo vacío
            const newHistory = state.getMyState()?.history ?? [];
            const username = ctx?.pushName ?? 'Usuario';

            console.log('[Historial Actual]:', newHistory);

            // Añade el mensaje entrante al historial
            newHistory.push({
                role: 'user',
                content: ctx.body,
            });

            console.log('[Mensaje Entrante]:', ctx.body);

            // Envía el historial actualizado a ChatGPT para generar una respuesta
            const aiResponse = await chatGPT(username, newHistory);

            // Divide la respuesta en fragmentos manejables por puntos o saltos de línea
            const chunks = aiResponse.split(/(?<!\d)\.\s+/g);

            for (const chunk of chunks) {
                await flowDynamic(chunk);
            }

            // Añade la respuesta de la IA al historial
            newHistory.push({
                role: 'assistant',
                content: aiResponse,
            });

            // Actualiza el estado con el historial modificado
            await state.update({ history: newHistory });

            console.log('[Historial Actualizado]:', newHistory);
        } catch (error) {
            console.error('[Error en welcomeFlow]:', error);
        }
    });

module.exports = welcomeFlow;
