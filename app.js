const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')
const { EVENTS } = require('@bot-whatsapp/bot/lib/bundle.bot.cjs')
const { chatGPT } = require('./src/openai/chatgpt')


// Flujo de bienvenida
const flowWelcome = addKeyword(EVENTS.WELCOME)
.addAnswer('Dime!!!, ¿Qué paso?', {
    delay: 1000,
    // Muestra una imagen random de gatitos en cada respuesta
    media: 'https://cataas.com/cat',
    capture: true,
},
async (ctx, ctxFn) => {
    const mensaje = ctx.body;
    console.log(mensaje);
    const respuesta = await chatGPT(mensaje)

    console.log(respuesta);
    await ctxFn.flowDynamic(respuesta)
})

// Flujo de saludo
const flowGreeting = addKeyword(['hola',])
    .addAnswer('Hola ¿cómo estás?')

const flowChatgpt = addKeyword(EVENTS.WELCOME)
.addAnswer('...', {
    delay: 1000,
    capture: true,
},
async (ctx, ctxFn) => {
    const mensaje = ctx.body;
    console.log(mensaje);
    const respuesta = await chatGPT(mensaje)

    console.log(respuesta);
    await ctxFn.flowDynamic(respuesta)

})
    

const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([
        flowGreeting, 
        flowWelcome,
        flowChatgpt,
    ])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
