const BotWhatsapp = require('@bot-whatsapp/bot')
const flows = require('./flows')
const adapterProvider = require('./providers')
const adapterDB = require('./database')
const QRPortalWeb = require('@bot-whatsapp/portal')

const main = async () => {

    BotWhatsapp.createBot({
        flow: flows,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
