// audio/services/local-audio-storage.service.ts

import { mkdir } from 'fs/promises';
import { join } from 'path';
import type { IAudioStorageService } from '~/audio/interfaces/audio-storage.interface';

export class LocalAudioStorageService implements IAudioStorageService {
  constructor(
    private readonly baseDir = join(process.cwd(), 'storage', 'audios')
  ) {}

  async prepareUserDir(userId: string, username: string): Promise<string> {
    const folderName = this.sanitize(`${username}_${userId}`);
    const userDir = join(this.baseDir, folderName);

    await mkdir(userDir, { recursive: true });

    return userDir;
  }

  // El nombre de carpeta combina pushName y número para que sea legible
  // y a la vez único por usuario
  private sanitize(value: string): string {
    return value.replace(/[^a-zA-Z0-9_-]/g, '');
  }
}
