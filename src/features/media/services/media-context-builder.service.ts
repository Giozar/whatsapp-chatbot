import type { MediaKind } from '~/features/media/interfaces/vision-service.interface';

export class MediaContextBuilder {
    buildVisionPrompt(kind: MediaKind): string {
        const label = kind === 'sticker' ? 'sticker' : 'imagen';

        return [
            `El usuario acaba de enviar un ${label}.`,
            'Interpreta lo que se ve y respondele de forma natural, breve y util.',
            'Si no puedes identificar el contenido, dilo sin inventar.',
        ].join(' ');
    }

    buildHistoryEntry(kind: MediaKind, response: string): string {
        const label = kind === 'sticker' ? 'Sticker' : 'Imagen';
        return `[${label} enviada por el usuario: ${response}]`;
    }
}
