const BotWhatsapp =  require('@bot-whatsapp/bot');
const chatGPT = require('../services/openai');

const preguntas = BotWhatsapp.addKeyword(BotWhatsapp.EVENTS.WELCOME)
.addAction(async (ctx, { flowDynamic, state }) => {
    const propmt = ctx.body;

    const response = await chatGPT(propmt);

    await flowDynamic(response);
    
});

module.exports = preguntas;