import { mkdir } from 'fs/promises';
import { join } from 'path';
import type { IAudioStorageService } from '~/features/voice/interfaces/audio-storage.interface';
import { appConfig } from '~/shared/config/app-config';

export class LocalAudioStorageService implements IAudioStorageService {
    constructor(private readonly baseDir = appConfig.voice.storage.audioDir) {}

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
