import { createBot, createProvider } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { flows } from './flows'
import { appConfig } from '~/shared/config/app-config'

const main = async () => {
    // Añade el objeto de configuración con la versión
    const adapterProvider = createProvider(Provider, {
        version: [2, 3000, 1035824857]
    })

    const adapterDB = new Database()

    const { httpServer } = await createBot({
        flow: flows,
        provider: adapterProvider,
        database: adapterDB,
    })

    httpServer(appConfig.server.port)
}

main()
