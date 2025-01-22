const BotWhatsapp =  require('@bot-whatsapp/bot')

const welcomeFlow = require('./welcome.flow');
const cotizarFlow = require('./cotizar.flow');
const catalogoFlow = require('./catalogo.flow');
const preguntas = require('./preguntas.flow');

const flows = BotWhatsapp.createFlow([
    welcomeFlow,
    // cotizarFlow,
    // catalogoFlow,
    // preguntas
])

module.exports = flows;