import { createFlow } from '@builderbot/bot';
import { voiceNoteFlow } from './voice-note.flow';
import { welcomeFlow } from './welcome.flow';

export const flows = createFlow([
    voiceNoteFlow,
    welcomeFlow,
]);
