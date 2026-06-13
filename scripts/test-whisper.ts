// scripts/test-whisper.ts
// Prueba manual del servicio de transcripción local:
// Requiere VOICE_MODE=local en tu .env
//   npx tsx scripts/test-whisper.ts <ruta-al-audio.ogg>

import { readFileSync } from 'fs';
import { createTranscriptionService } from '~/features/voice/factories/transcription.factory';

const audioPath = process.argv[2];
if (!audioPath) {
  console.error('Uso: npx tsx scripts/test-whisper.ts <ruta-al-audio.ogg>');
  process.exit(1);
}

const service = createTranscriptionService();
const audioBuffer = readFileSync(audioPath);

console.time('transcripcion');
const text = await service.transcribe(audioBuffer);
console.timeEnd('transcripcion');

console.log('Transcripción:', text);
