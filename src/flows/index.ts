import { createFlow } from '@builderbot/bot';
import { mediaFlow } from './media.flow';
import { voiceNoteFlow } from './voice-note.flow';
import { welcomeFlow } from './welcome.flow';

export const flows = createFlow([
    mediaFlow,
    voiceNoteFlow,
    welcomeFlow,
]);
