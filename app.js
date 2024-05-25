const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')
const { EVENTS } = require('@bot-whatsapp/bot/lib/bundle.bot.cjs')

const flowPrincipal = addKeyword(['hola', 'oye', 'hey', 'bro'])
    .addAnswer('Hola cómo estás soy el bot Giovanni, ¿Qué pasa?')
    .addAnswer('Te contesto más tarde')

    const flowWelcome = addKeyword(EVENTS.WELCOME)
    .addAnswer('Bienvenido!!!, ¿En qué puedo ayudarte?', {
        delay: 1000,
        // Muestra una imagen random de gatitos en cada respuesta
        media: 'https://cataas.com/cat',
    },
    async (ctx, ctxFn) => {
        if (ctx.body.includes('gatos')) {
            await ctxFn.flowDynamic('Escribiste gatos')
        } else {
            await ctxFn.flowDynamic('Escribiste otra cosa')
        }
        console.log(ctx.body);
        await ctxFn.flowDynamic('Hola estoy en el Dynamic Flow')
    })
    

const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flowPrincipal, flowWelcome])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
