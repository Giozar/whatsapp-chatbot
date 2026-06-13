export type MediaKind = 'image' | 'sticker';

export interface MediaInput {
    mimeType: string;
    base64: string;
    filePath: string;
    kind: MediaKind;
}
