import { addKeyword, EVENTS } from '@builderbot/bot';
import { createConversationService } from '~/features/chat/factories/conversation.factory';
import { appConfig } from '~/shared/config/app-config';
import { splitResponseIntoChunks } from '~/features/chat/utils/split-response';

const conversationService = createConversationService();
const randomDelay = () =>
    Math.floor(
        Math.random() * (appConfig.reply.maxDelayMs - appConfig.reply.minDelayMs + 1)
    ) + appConfig.reply.minDelayMs;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const welcomeFlow = addKeyword(EVENTS.WELCOME).addAction(
    async (ctx, { flowDynamic, state }) => {
        try {
            const history = state.getMyState()?.history ?? [];
            const username = ctx?.pushName ?? 'Usuario';

            console.log(`[${username}] ha enviado un mensaje: ${ctx.body}`);

            const { response, history: nextHistory } = await conversationService.generateReply({
                username,
                incomingText: ctx.body,
                history,
            });

            await sleep(randomDelay());

            for (const chunk of splitResponseIntoChunks(response)) {
                await flowDynamic(chunk);
            }

            await state.update({ history: nextHistory });
        } catch (error) {
            console.error('[Error en welcomeFlow]', error);
        }
    }
);
