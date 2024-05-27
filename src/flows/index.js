const BotWhatsapp =  require('@bot-whatsapp/bot')

const helloFlow = require('./hello.flow')
const welcomeFlow = require('./welcome.flow')

const flows =  BotWhatsapp.createFlow([
    helloFlow,
    welcomeFlow
])

module.exports = flows;