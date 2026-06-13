import { mkdir } from 'fs/promises';
import { join } from 'path';
import type { IMediaStorageService } from '~/features/media/interfaces/media-storage.interface';
import { appConfig } from '~/shared/config/app-config';

export class LocalMediaStorageService implements IMediaStorageService {
    constructor(private readonly baseDir = appConfig.vision.storage.mediaDir) {}

    async prepareUserDir(userId: string, username: string): Promise<string> {
        const folderName = this.sanitize(`${username}_${userId}`);
        const userDir = join(this.baseDir, folderName);

        await mkdir(userDir, { recursive: true });

        return userDir;
    }

    private sanitize(value: string): string {
        return value.replace(/[^a-zA-Z0-9_-]/g, '');
    }
}
