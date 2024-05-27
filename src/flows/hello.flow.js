const BotWhatsapp = require('@bot-whatsapp/bot')

const helloFlow = BotWhatsapp.addKeyword(['Hola'])
.addAnswer('Hola, soy un bot de ventas de Airontools, ¿En qué puedo ayudarte?')

module.exports = helloFlow