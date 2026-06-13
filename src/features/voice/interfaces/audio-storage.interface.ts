export interface IAudioStorageService {
    prepareUserDir(userId: string, username: string): Promise<string>;
}

