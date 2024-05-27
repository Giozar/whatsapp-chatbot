const BotWhatsapp =  require('@bot-whatsapp/bot')

const welcomeFlow = BotWhatsapp.addKeyword(BotWhatsapp.EVENTS.WELCOME)
.addAnswer('Hola, soy un bot de ventas de Airontools, ¿En qué puedo ayudarte?')

module.exports = welcomeFlow