// flows/voice-note.flow.ts

import { addKeyword, EVENTS } from '@builderbot/bot';
import { readFileSync } from 'fs';
import { OllamaService } from '~/services/ollama.service';
import type { ITranscriptionService } from '~/audio/interfaces/transcription.interface';
import type { IAudioStorageService } from '~/audio/interfaces/audio-storage.interface';
import { createTranscriptionService } from '~/audio/factories/transcription.factory';
import { LocalAudioStorageService } from '~/audio/services/local-audio-storage.service';

const transcriptionService: ITranscriptionService = createTranscriptionService();
const audioStorage: IAudioStorageService = new LocalAudioStorageService();

export const voiceNoteFlow = addKeyword(EVENTS.VOICE_NOTE).addAction(
  async (ctx, { flowDynamic, state, provider }) => {
    try {
      const username = ctx?.pushName ?? 'Usuario';
      console.log(`[${username}] ha enviado una nota de voz.`);

      // 1. Guardar el audio en la carpeta del usuario (storage/audios/<usuario>/)
      const userDir = await audioStorage.prepareUserDir(ctx.from, username);
      const audioPath = await provider.saveFile(ctx, { path: userDir });
      console.log(`[${username}] audio guardado en: ${audioPath}`);

      const audioBuffer = readFileSync(audioPath);
      const mimeType: string = ctx.message?.audioMessage?.mimetype ?? 'audio/ogg';

      // 2. Transcribe with the injected service
      const transcribedText = await transcriptionService.transcribe(audioBuffer, mimeType);
      console.log(`[${username}] Transcripción: "${transcribedText}"`);

      if (!transcribedText) {
        await flowDynamic('no entendí bien lo que dijiste, puedes escribirlo?');
        return;
      }

      // 3. Pass transcription through AI service — same pipeline as text
      const conversationHistory = state.getMyState()?.history ?? [];
      conversationHistory.push({ role: 'user', content: transcribedText });

      const aiResponse = await OllamaService({ username, history: conversationHistory });

      const chunks = aiResponse.split(/(?<!\d)\.\s+/g);
      const delay = Math.floor(Math.random() * (15000 - 3000 + 1)) + 3000;

      setTimeout(async () => {
        for (const chunk of chunks) {
          await flowDynamic(chunk);
        }
        conversationHistory.push({ role: 'assistant', content: aiResponse });
        await state.update({ history: conversationHistory });
      }, delay);

    } catch (error) {
      console.error('[Error en voiceNoteFlow]', error);
      await flowDynamic('tuve un problema procesando tu mensaje de voz');
    }
  }
);
