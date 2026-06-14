import { addKeyword, EVENTS } from '@builderbot/bot';
import { readFileSync } from 'fs';
import { createConversationService } from '~/features/chat/factories/conversation.factory';
import { createConversationStateManager } from '~/features/chat/factories/conversation-state-manager.factory';
import { splitResponseIntoChunks } from '~/features/chat/utils/split-response';
import { printConversationHistory } from '~/features/chat/utils/print-history';
import type {
    MediaInput,
    MediaKind,
} from '~/features/media/interfaces/vision-service.interface';
import type { IMediaStorageService } from '~/features/media/interfaces/media-storage.interface';
import { createMediaStorageService } from '~/features/media/factories/media-storage.factory';
import { MediaNormalizer } from '~/features/media/services/media-normalizer.service';
import { appConfig } from '~/shared/config/app-config';

const mediaStorage: IMediaStorageService = createMediaStorageService();
const mediaNormalizer = new MediaNormalizer();
const conversationService = createConversationService();
const stateManager = createConversationStateManager();
const randomDelay = () =>
    Math.floor(
        Math.random() * (appConfig.reply.maxDelayMs - appConfig.reply.minDelayMs + 1)
    ) + appConfig.reply.minDelayMs;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mediaFlow = addKeyword(EVENTS.MEDIA).addAction(
    async (ctx, { flowDynamic, provider }) => {
        try {
            const username = ctx?.pushName ?? 'Usuario';
            const mediaKind = getMediaKind(ctx);

            if (!mediaKind) {
                await flowDynamic('solo puedo interpretar imagenes y stickers por ahora');
                return;
            }

            if (!appConfig.vision.enabled) {
                await flowDynamic('no puedo interpretar imagenes por ahora');
                return;
            }

            console.log(
                `[${username}] ha enviado ${
                    mediaKind === 'sticker' ? 'un sticker' : 'una imagen'
                }.`
            );

            const userDir = await mediaStorage.prepareUserDir(ctx.from, username);
            const mediaPath = await provider.saveFile(ctx, { path: userDir });
            console.log(`[${username}] media guardada en: ${mediaPath}`);

            const mediaBuffer = readFileSync(mediaPath);
            const { base64, mimeType } = await mediaNormalizer.normalize(mediaBuffer);
            const media: MediaInput = {
                kind: mediaKind,
                filePath: mediaPath,
                mimeType,
                base64,
            };

            const { history, summary, stored } = await stateManager.load(ctx.from);

            const { response, history: nextHistory, summary: nextSummary, didSummarize } =
                await conversationService.generateMediaReply({
                    username,
                    media,
                    history,
                    summary,
                });

            await sleep(randomDelay());

            for (const chunk of splitResponseIntoChunks(response)) {
                await flowDynamic(chunk);
            }

            await stateManager.persist({
                userId: ctx.from,
                username,
                history: nextHistory,
                summary: nextSummary,
                stored,
            });

            printConversationHistory({
                userId: ctx.from,
                username,
                history: nextHistory,
                summary: nextSummary,
                didSummarize,
            });
        } catch (error) {
            console.error('[Error en mediaFlow]', error);
            await flowDynamic('tuve un problema procesando esa imagen');
        }
    }
);

const getMediaKind = (ctx: any): MediaKind | null => {
    if (ctx.message?.imageMessage) return 'image';
    if (ctx.message?.stickerMessage) return 'sticker';
    return null;
};
