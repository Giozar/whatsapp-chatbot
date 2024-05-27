const BotWhatsapp =  require('@bot-whatsapp/bot')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')

const adapterProvider = BotWhatsapp.createProvider(BaileysProvider)

module.exports = adapterProvider