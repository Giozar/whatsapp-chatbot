const BotWhatsapp =  require('@bot-whatsapp/bot')

const welcomeFlow = require('./welcome.flow');
const cotizarFlow = require('./cotizar.flow');

const flows =  BotWhatsapp.createFlow([
    welcomeFlow,
    cotizarFlow,
])

module.exports = flows;