const BotWhatsapp =  require('@bot-whatsapp/bot');
const chatGPT  = require('../services/openai');

const welcomeFlow = BotWhatsapp.addKeyword(BotWhatsapp.EVENTS.WELCOME)
.addAction( async (ctx, {flowDynamic, state }) => {
    try {
        const newHistory = state.getMyState()?.history ?? [];
        const username = ctx?.pushName ?? 'Usuario';

        console.log('[Historial]: ', newHistory);
        
        newHistory.push({
            role: 'user',
            content: ctx.body
        });

        console.log('[Mensaje Entrante]: ', ctx.body);

        const ai = await chatGPT(username, newHistory);

        // Divide el texto en fragmentos de texto de acuerdo a los puntos y saltos de línea: 
        const chunks = ai.split(/(?<!\d)\.\s+/g);

        for (const chunk of chunks) {
            await flowDynamic(chunk);
        }


        newHistory.push({
            role: 'assistant',
            content: ai
        });

        await state.update({hsitory: newHistory});

    } catch (error) {
        console.log(error);
    }
})

module.exports = welcomeFlow