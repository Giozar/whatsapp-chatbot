import sharp from 'sharp';

export class MediaNormalizer {
    async normalize(buffer: Buffer): Promise<{ base64: string; mimeType: string }> {
        const png = await sharp(buffer, { animated: false })
            .flatten({ background: { r: 255, g: 255, b: 255 } })
            .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
            .png()
            .toBuffer();

        return { base64: png.toString('base64'), mimeType: 'image/png' };
    }
}
