import type { IMediaStorageService } from '~/features/media/interfaces/media-storage.interface';
import { LocalMediaStorageService } from '~/features/media/services/local-media-storage.service';

export const createMediaStorageService = (): IMediaStorageService =>
    new LocalMediaStorageService();
