# WhatsApp Chatbot

Bot de WhatsApp con BuilderBot, soporte para LLM local o cloud y transcripcion de notas de voz local o cloud. La arquitectura esta separada por features para que texto, voz y proveedores de IA puedan cambiarse sin tocar los flows.

## Arquitectura

- `src/features/chat`: historial, prompt, armado de mensajes y pipeline de respuesta.
- `src/features/llm`: interfaz comun, factory y adapters de `ollama`, `openai` y `groq`.
- `src/features/voice`: transcripcion, almacenamiento local de audios y factories de voz.
- `src/shared/config`: carga y validacion de `.env`.
- `src/flows`: integracion con BuilderBot.

La referencia completa esta en [docs/project-overview.md](docs/project-overview.md).

## Configuracion

La configuracion se organiza por modo:

- `LLM_MODE=local|cloud`
- `VOICE_MODE=local|cloud`

Para `LLM_MODE=local` se usa Ollama y debes definir `OLLAMA_MODEL`, `OLLAMA_HOST` y `USES_MODELFILE`. Para `LLM_MODE=cloud` eliges `LLM_PROVIDER=openai|groq` y configuras su API key y modelo.

Para `VOICE_MODE=local` se usa Whisper local y basta con `WHISPER_MODEL`; el modelo se descarga en el primer uso a `MODEL_CACHE_DIR`. Para `VOICE_MODE=cloud` se usa Groq y necesitas `GROQ_API_KEY` y `GROQ_TRANSCRIPTION_MODEL`.

Revisa [example.env](example.env) para la plantilla completa.

## Desarrollo

```bash
pnpm install
pnpm run dev
```

Comandos utiles:

- `pnpm run lint`
- `pnpm run build`
- `pnpm start`
- `npx tsx scripts/test-whisper.ts <ruta-al-audio.ogg>`
