const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')
const { EVENTS } = require('@bot-whatsapp/bot/lib/bundle.bot.cjs')
const { chatGPT } = require('./src/openai/chatgpt')


// Flujo de palabras clave - Saludo inicial
const flowGreeting = addKeyword(['hola',])
.addAnswer('Hola ¿cómo estás?')

// Flujo de inicio
const flowWelcome = addKeyword(EVENTS.WELCOME)
.addAnswer('¡Bienvenidos estamos aquí para ayudarte!' + '\nEscribe "Menu" para ver las opciones disponibles',{
    delay: 500,
    capture: true,
}, async (ctx, ctxFn) => {
    const mensaje = ctx.body;
    const respuesta = await chatGPT(mensaje);
    await ctxFn.flowDynamic(respuesta)

})


// Si usamos el menu ocupamos el EVENTS.ACTION
const flowCats = addKeyword(EVENTS.ACTION)
.addAnswer('Te muestro de momento fotos de gatitos', {
    delay: 500,
    // Muestra una imagen random de gatitos en cada respuesta
    media: 'https://cataas.com/cat',
    capture: true,
});


const flowMenu = addKeyword('menu')
    .addAnswer('Elige una opción:'
    + '\n1. Gatos'
    + '\n0. Salir'
    , {
        capture: true,
    },
    async (ctx, { gotoFlow, fallBack, flowDynamic}) => {
        if (!['0', '1',].includes(ctx.body)) {
            return fallBack(
                'Por favor elige una opción válida'
                + '\nElige una opción:'
                + '\n1. Gatos'
                + '\n0. Salir'
            )
        }

        switch (ctx.body) {
            case '0': 
                return await flowDynamic('Saliendo del menu...' + '\nEscribe "Menu" para volver a ver las opciones');
            case '1':
                return gotoFlow(flowCats)
        }
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
        flowMenu,
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
