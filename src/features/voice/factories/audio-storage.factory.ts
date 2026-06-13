import type { IAudioStorageService } from '~/features/voice/interfaces/audio-storage.interface';
import { LocalAudioStorageService } from '~/features/voice/services/local-audio-storage.service';

export const createAudioStorageService = (): IAudioStorageService =>
    new LocalAudioStorageService();

