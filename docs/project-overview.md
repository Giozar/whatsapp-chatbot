# WhatsApp Chatbot - Arquitectura y Configuracion

## Resumen

Este proyecto conecta BuilderBot con WhatsApp para responder mensajes de texto y notas de voz usando proveedores de IA locales o cloud. La logica esta organizada por features para que los flows no dependan de SDKs concretos ni de variables de entorno dispersas.

## Estructura actual

```text
src/
├── app.ts
├── flows/
├── features/
│   ├── chat/
│   ├── llm/
│   └── voice/
└── shared/
    └── config/
```

- `features/chat`: historial, prompt del sistema, armado de mensajes, chunking y `ConversationService`.
- `features/llm`: `ILLMService`, `createLLMService()` y adapters para Ollama, OpenAI y Groq.
- `features/voice`: `ITranscriptionService`, `IAudioStorageService`, factories y servicios locales/cloud.
- `shared/config`: `appConfig` con validacion fail-fast.
- `flows`: capa BuilderBot que solo orquesta eventos y delega a servicios.

## Flujo de ejecucion

### Texto

1. `welcome.flow.ts` recibe el mensaje.
2. El flow carga el historial del usuario desde `state`.
3. `ConversationService` agrega el mensaje, construye el prompt y llama al LLM seleccionado por factory.
4. La respuesta se divide en chunks y se envia al usuario.
5. El historial actualizado se guarda en `state`.

### Voz

1. `voice-note.flow.ts` guarda el audio en `AUDIO_STORAGE_DIR`.
2. `createTranscriptionService()` selecciona transcripcion local o cloud segun `VOICE_MODE`.
3. El texto transcrito entra al mismo pipeline de `ConversationService`.
4. La respuesta vuelve a salir por chunks y el historial se actualiza igual que en texto.

## Configuracion por modo

### General

```env
PORT=3008
LLM_MODE=local
VOICE_MODE=local
REPLY_MIN_DELAY_MS=3000
REPLY_MAX_DELAY_MS=15000
```

### LLM local

Usa Ollama en la misma maquina.

```env
LLM_MODE=local
LLM_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest
USES_MODELFILE=false
AI_MODEL=llama3.2:latest
```

- `OLLAMA_MODEL` es la variable recomendada.
- `AI_MODEL` se mantiene como alias legacy por compatibilidad.
- `USES_MODELFILE=true` evita agregar el system prompt porque se asume que el modelo ya trae instrucciones.

### LLM cloud

Usa un proveedor remoto por API.

```env
LLM_MODE=cloud
LLM_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
```

Tambien puedes usar Groq:

```env
LLM_MODE=cloud
LLM_PROVIDER=groq
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile
```

### Voz local

Usa Whisper local y descarga el modelo al primer uso.

```env
VOICE_MODE=local
TRANSCRIPTION_PROVIDER=local
WHISPER_MODEL=Xenova/whisper-small
MODEL_CACHE_DIR=storage/models
```

### Voz cloud

Usa Groq para transcripcion.

```env
VOICE_MODE=cloud
TRANSCRIPTION_PROVIDER=groq
GROQ_API_KEY=...
GROQ_TRANSCRIPTION_MODEL=whisper-large-v3-turbo
```

### Storage local

```env
AUDIO_STORAGE_DIR=storage/audios
```

## Reglas de validacion

- `LLM_MODE=local` fuerza el uso de Ollama.
- `LLM_MODE=cloud` exige `LLM_PROVIDER=openai|groq`.
- `VOICE_MODE=local` fuerza transcripcion local.
- `VOICE_MODE=cloud` exige `GROQ_API_KEY` y `GROQ_TRANSCRIPTION_MODEL`.
- Si la configuracion seleccionada no tiene variables suficientes, el bot falla al iniciar con un error claro.

## Comandos

```bash
pnpm install
pnpm run dev
pnpm run lint
pnpm run build
pnpm start
npx tsx scripts/test-whisper.ts <ruta-al-audio.ogg>
```

Para probar Whisper local, usa `VOICE_MODE=local`.
