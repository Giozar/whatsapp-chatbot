// audio/interfaces/audio-storage.interface.ts

export interface IAudioStorageService {
  /**
   * Crea (si no existe) y retorna la carpeta donde se guardan
   * los audios de un usuario específico.
   */
  prepareUserDir(userId: string, username: string): Promise<string>;
}
