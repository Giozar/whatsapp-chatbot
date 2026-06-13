export interface IMediaStorageService {
    prepareUserDir(userId: string, username: string): Promise<string>;
}
