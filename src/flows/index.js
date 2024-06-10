const BotWhatsapp =  require('@bot-whatsapp/bot')

const welcomeFlow = require('./welcome.flow');
const cotizarFlow = require('./cotizar.flow');
const catalogoFlow = require('./catalogo.flow');

const flows = BotWhatsapp.createFlow([
    welcomeFlow,
    cotizarFlow,
    catalogoFlow,
])

module.exports = flows;