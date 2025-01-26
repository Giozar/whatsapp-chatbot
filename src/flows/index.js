const BotWhatsapp =  require('@bot-whatsapp/bot')

const welcomeFlow = require('./welcome.flow');

const flows = BotWhatsapp.createFlow([
    welcomeFlow,
])

module.exports = flows;