const BotWhatsapp =  require('@bot-whatsapp/bot');
const chatGPT = require('../services/openai');
const preguntasChatgpt = require('../services/openai/preguntasChatgpt');

const preguntas = BotWhatsapp.addKeyword(BotWhatsapp.EVENTS.WELCOME)
.addAction(async (ctx, { flowDynamic, state }) => {
    const propmt = ctx.body;

    const response = await preguntasChatgpt({propmt});

    await flowDynamic(response);
    
});

module.exports = preguntas;