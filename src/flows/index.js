const BotWhatsapp =  require('@bot-whatsapp/bot')

const helloFlow = require('./hello.flow')
const welcomeFlow = require('./welcome.flow');
const cotizarFlow = require('./cotizar.flow');

const flows =  BotWhatsapp.createFlow([
    helloFlow,
    welcomeFlow,
    cotizarFlow,
])

module.exports = flows;