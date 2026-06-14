import { addKeyword, EVENTS } from '@builderbot/bot';
import { createConversationService } from '~/features/chat/factories/conversation.factory';
import { createConversationStateManager } from '~/features/chat/factories/conversation-state-manager.factory';
import { appConfig } from '~/shared/config/app-config';
import { splitResponseIntoChunks } from '~/features/chat/utils/split-response';
import { printConversationHistory } from '~/features/chat/utils/print-history';

const conversationService = createConversationService();
const stateManager = createConversationStateManager();
const randomDelay = () =>
    Math.floor(
        Math.random() * (appConfig.reply.maxDelayMs - appConfig.reply.minDelayMs + 1)
    ) + appConfig.reply.minDelayMs;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const welcomeFlow = addKeyword(EVENTS.WELCOME).addAction(
    async (ctx, { flowDynamic }) => {
        try {
            const username = ctx?.pushName ?? 'Usuario';
            const { history, summary, stored } = await stateManager.load(ctx.from);

            console.log(`[${username}] ha enviado un mensaje: ${ctx.body}`);

            const { response, history: nextHistory, summary: nextSummary, didSummarize } =
                await conversationService.generateReply({
                    username,
                    incomingText: ctx.body,
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
            console.error('[Error en welcomeFlow]', error);
        }
    }
);
