import { createBot, createProvider, createFlow } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { welcomeFlow } from './flows/welcome.flow'

const PORT = process.env.PORT ?? 3008
const main = async () => {
    const adapterFlow = createFlow([welcomeFlow])

    // Añade el objeto de configuración con la versión
    const adapterProvider = createProvider(Provider, {
        version: [2, 3000, 1035824857]
    })

    const adapterDB = new Database()

    const { httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    httpServer(+PORT)
}

main()
