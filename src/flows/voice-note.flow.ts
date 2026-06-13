// flows/voice-note.flow.ts
import { addKeyword, EVENTS } from '@builderbot/bot';
import { readFileSync } from 'fs';
import { createConversationService } from '~/features/chat/factories/conversation.factory';
import { splitResponseIntoChunks } from '~/features/chat/utils/split-response';
import type { IAudioStorageService } from '~/features/voice/interfaces/audio-storage.interface';
import type { ITranscriptionService } from '~/features/voice/interfaces/transcription.interface';
import { createAudioStorageService } from '~/features/voice/factories/audio-storage.factory';
import { createTranscriptionService } from '~/features/voice/factories/transcription.factory';
import { appConfig } from '~/shared/config/app-config';

const transcriptionService: ITranscriptionService = createTranscriptionService();
const audioStorage: IAudioStorageService = createAudioStorageService();
const conversationService = createConversationService();
const randomDelay = () =>
    Math.floor(
        Math.random() * (appConfig.reply.maxDelayMs - appConfig.reply.minDelayMs + 1)
    ) + appConfig.reply.minDelayMs;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const voiceNoteFlow = addKeyword(EVENTS.VOICE_NOTE).addAction(
    async (ctx, { flowDynamic, state, provider }) => {
        try {
            const username = ctx?.pushName ?? 'Usuario';
            console.log(`[${username}] ha enviado una nota de voz.`);

            const userDir = await audioStorage.prepareUserDir(ctx.from, username);
            const audioPath = await provider.saveFile(ctx, { path: userDir });
            console.log(`[${username}] audio guardado en: ${audioPath}`);

            const audioBuffer = readFileSync(audioPath);
            const mimeType = ctx.message?.audioMessage?.mimetype ?? 'audio/ogg';
            const transcribedText = await transcriptionService.transcribe(audioBuffer, mimeType);

            console.log(`[${username}] Transcripción: "${transcribedText}"`);

            if (!transcribedText) {
                await flowDynamic('no entendi bien lo que dijiste, puedes escribirlo?');
                return;
            }

            const history = state.getMyState()?.history ?? [];
            const { response, history: nextHistory } = await conversationService.generateReply({
                username,
                incomingText: transcribedText,
                history,
            });

            await sleep(randomDelay());

            for (const chunk of splitResponseIntoChunks(response)) {
                await flowDynamic(chunk);
            }

            await state.update({ history: nextHistory });
        } catch (error) {
            console.error('[Error en voiceNoteFlow]', error);
            await flowDynamic('tuve un problema procesando tu mensaje de voz');
        }
    }
);
