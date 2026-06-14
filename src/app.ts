import { createBot, createProvider } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import { flows } from './flows'
import { appConfig } from '~/shared/config/app-config'

const main = async () => {
    const adapterProvider = createProvider(Provider, {
        version: [2, 3000, 1035824857]
    })

    // Workaround: el getMimeType del provider de Baileys no contempla stickerMessage,
    // por lo que saveFile lanza "MIME type not found" para stickers. Lo extendemos para
    // que reconozca el mimetype del sticker (image/webp) y permita descargarlo.
    const providerInternals = adapterProvider as unknown as {
        getMimeType: (ctx: any) => string | undefined
    }
    const originalGetMimeType = providerInternals.getMimeType.bind(adapterProvider)
    providerInternals.getMimeType = (ctx: any) => {
        const mimeType = originalGetMimeType(ctx)
        if (mimeType) return mimeType
        if (ctx?.message?.stickerMessage) {
            return ctx.message.stickerMessage.mimetype ?? 'image/webp'
        }
        return undefined
    }

    const adapterDB = new Database()

    const bot = await createBot({
        flow: flows,
        provider: adapterProvider,
        database: adapterDB,
    })

    bot.httpServer(appConfig.server.port)

    let isShuttingDown = false

    const shutdown = async (signal: string) => {
        if (isShuttingDown) return
        isShuttingDown = true

        console.log(`[shutdown] señal ${signal} recibida, cerrando...`)

        // Force-exit si la limpieza se cuelga
        const forceExit = setTimeout(() => {
            console.log('[shutdown] timeout alcanzado, forzando salida')
            process.exit(1)
        }, 3000)
        forceExit.unref()

        try {
            await adapterProvider.vendor?.end?.(undefined)
            await adapterProvider.releaseSessionFiles?.()
        } catch {
            // best-effort
        } finally {
            clearTimeout(forceExit)
            console.log('[shutdown] listo')
            process.exit(0)
        }
    }

    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('SIGTERM', () => shutdown('SIGTERM'))
}

main().catch((err) => {
    console.error('[fatal] error al iniciar el bot', err)
    process.exit(1)
})
