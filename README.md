# WhatsApp Chatbot

Bot de WhatsApp con BuilderBot, soporte para LLM local o cloud, transcripcion de notas de voz local o cloud, e interpretacion de imagenes/stickers con modelos multimodales. La arquitectura esta separada por features para que texto, voz, media y proveedores de IA puedan cambiarse sin tocar los flows.

## Arquitectura

- `src/features/chat`: historial, prompt, armado de mensajes y pipeline de respuesta.
- `src/features/llm`: interfaz comun, factory y adapters de `ollama`, `openai` y `groq`.
- `src/features/media`: almacenamiento local de imagenes/stickers y armado de contexto visual.
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

Para imagenes y stickers, activa `VISION_ENABLED=true`. `VISION_MODEL_MULTIMODAL=true` declara que el modelo elegido soporta vision; si esta en `false`, el bot falla al iniciar para evitar una configuracion invalida. Con `VISION_USE_TEXT_MODEL=true`, la vision reutiliza el modelo de texto activo (`OLLAMA_MODEL`, `OPENAI_MODEL` o `GROQ_MODEL`). Con `VISION_USE_TEXT_MODEL=false`, usa el modelo de vision del proveedor activo: `OLLAMA_VISION_MODEL`, `OPENAI_VISION_MODEL` o `GROQ_VISION_MODEL`. Los archivos se guardan en `MEDIA_STORAGE_DIR`, pero el historial solo conserva texto descriptivo.

El bot toma el nombre del usuario desde `ctx.pushName`. Si `USES_MODELFILE=false`, ese nombre entra al `system prompt`. Si `USES_MODELFILE=true`, el nombre viaja como contexto transitorio de usuario para no reemplazar el prompt del Modelfile.

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
