import { createFlow } from '@builderbot/bot';
import { welcomeFlow } from './welcome.flow';

export const flows = createFlow([
    welcomeFlow,
]);