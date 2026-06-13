import { addKeyword, EVENTS } from '@builderbot/bot';
import { readFileSync } from 'fs';
import { extname } from 'path';
import { createConversationService } from '~/features/chat/factories/conversation.factory';
import { splitResponseIntoChunks } from '~/features/chat/utils/split-response';
import { printConversationHistory } from '~/features/chat/utils/print-history';
import type {
    MediaInput,
    MediaKind,
} from '~/features/media/interfaces/vision-service.interface';
import type { IMediaStorageService } from '~/features/media/interfaces/media-storage.interface';
import { createMediaStorageService } from '~/features/media/factories/media-storage.factory';
import { appConfig } from '~/shared/config/app-config';

const mediaStorage: IMediaStorageService = createMediaStorageService();
const conversationService = createConversationService();
const randomDelay = () =>
    Math.floor(
        Math.random() * (appConfig.reply.maxDelayMs - appConfig.reply.minDelayMs + 1)
    ) + appConfig.reply.minDelayMs;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mediaFlow = addKeyword(EVENTS.MEDIA).addAction(
    async (ctx, { flowDynamic, state, provider }) => {
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
            const mimeType = getMimeType(ctx, mediaKind, mediaPath);
            const media: MediaInput = {
                kind: mediaKind,
                filePath: mediaPath,
                mimeType,
                base64: mediaBuffer.toString('base64'),
            };

            const currentState = state.getMyState() ?? {};
            const history = currentState.history ?? [];
            const summary = currentState.summary as string | undefined;

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

            await state.update({ history: nextHistory, summary: nextSummary });

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

const getMimeType = (ctx: any, kind: MediaKind, filePath: string): string => {
    const mimeType =
        ctx.message?.imageMessage?.mimetype ?? ctx.message?.stickerMessage?.mimetype;

    if (mimeType) return mimeType;

    const extension = extname(filePath).toLowerCase();

    if (extension === '.png') return 'image/png';
    if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
    if (extension === '.webp' || kind === 'sticker') return 'image/webp';

    return 'application/octet-stream';
};
