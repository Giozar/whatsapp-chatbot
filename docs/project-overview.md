# WhatsApp Chatbot - Descripcion General del Proyecto

## Resumen Ejecutivo

**WhatsApp Chatbot** es un servicio de automatizacion que conecta la API de WhatsApp con modelos de inteligencia artificial para responder automaticamente los mensajes que reciben los usuarios. Capacidades actuales:

- Recibir y responder mensajes de texto en tiempo real
- Entender notas de voz: transcribirlas a texto y responderlas como cualquier mensaje
- Guardar los audios recibidos organizados en una carpeta por usuario
- Mantener historial de conversacion por usuario (aislado en memoria)
- Resumir automaticamente el historial cuando crece demasiado
- Imprimir el historial completo de cada usuario en consola para observabilidad
- Generar respuestas usando modelos AI intercambiables (Ollama, OpenAI, Groq)
- Apagado limpio al recibir SIGINT/SIGTERM (Ctrl+C en desarrollo)

---

## Arquitectura General

```
WhatsApp API (Baileys)
    |
BuilderBot Framework
    |-- Welcome Flow (texto)
    |       |-- ConversationService
    |               |-- MessageBuilder (system prompt + historial)
    |               |-- LLMService (Ollama | OpenAI | Groq)
    |               |-- HistorySummarizer (si history.length > maxMessages)
    |               |-- printConversationHistory (consola)
    |
    |-- Voice Note Flow (audio)
            |-- LocalAudioStorageService  →  storage/audios/<usuario>/
            |-- TranscriptionService (Whisper local | Groq Whisper)
            |-- ConversationService (mismo pipeline que texto)
```

---

## Estructura del Proyecto

```
src/
├── app.ts                                        # Entrada, graceful shutdown
├── flows/
│   ├── index.ts                                  # Registro de flows en BuilderBot
│   ├── welcome.flow.ts                           # Flow de mensajes de texto
│   └── voice-note.flow.ts                        # Flow de notas de voz
├── features/
│   ├── chat/
│   │   ├── builders/
│   │   │   ├── message.builder.ts                # Arma el array de mensajes para el LLM
│   │   │   └── prompt.builder.ts                 # System prompt de personalidad
│   │   ├── factories/
│   │   │   └── conversation.factory.ts           # Crea ConversationService con dependencias
│   │   ├── services/
│   │   │   ├── conversation.service.ts           # Orquesta respuesta + resumen
│   │   │   └── history-summarizer.service.ts     # Resume historial usando el LLM
│   │   ├── types/
│   │   │   ├── chat-message.ts                   # ChatMessage { role, content }
│   │   │   └── conversation-state.ts             # ConversationState { history, summary? }
│   │   └── utils/
│   │       ├── print-history.ts                  # Imprime historial formateado en consola
│   │       └── split-response.ts                 # Divide respuesta en chunks por oracion
│   ├── llm/
│   │   ├── factories/
│   │   │   └── llm.factory.ts                    # Selecciona LLMService segun config
│   │   ├── interfaces/
│   │   │   └── llm-service.interface.ts          # ILLMService { generateResponse() }
│   │   └── services/
│   │       ├── groq-llm.service.ts               # Adaptador Groq
│   │       ├── ollama-llm.service.ts             # Adaptador Ollama
│   │       └── openai-llm.service.ts             # Adaptador OpenAI
│   └── voice/
│       ├── factories/
│       │   ├── audio-storage.factory.ts          # Crea IAudioStorageService
│       │   └── transcription.factory.ts          # Selecciona proveedor de transcripcion
│       ├── interfaces/
│       │   ├── audio-storage.interface.ts        # IAudioStorageService { prepareUserDir() }
│       │   └── transcription.interface.ts        # ITranscriptionService { transcribe() }
│       └── services/
│           ├── groq-transcription.service.ts     # Whisper via Groq API
│           ├── local-audio-storage.service.ts    # Carpetas por usuario en disco
│           └── local-whisper-transcription.service.ts  # Whisper ONNX local
└── shared/
    └── config/
        └── app-config.ts                         # Configuracion centralizada con validacion fail-fast

storage/                    # (generado en runtime, ignorado por git)
├── audios/
│   └── <PushName>_<numero>/   # Una carpeta por remitente
│       └── file-<timestamp>.ogg
└── models/                 # Modelos Whisper descargados (modo local)

scripts/
└── test-whisper.ts         # Prueba manual de transcripcion

docs/
├── project-overview.md     # Este archivo
└── previous-document.md    # Documento historico de arquitectura anterior
```

---

## Tecnologias Utilizadas

| Tecnologia | Proposito | Version |
|---|---|---|
| **@builderbot/bot** | Framework principal para flujos de conversacion | 1.4.1 |
| **@builderbot/provider-baileys** | Proveedor WhatsApp basado en Baileys (sin API oficial) | 1.4.1 |
| **TypeScript** | Lenguaje tipado para mayor seguridad | ^5.4.3 |
| **Rollup** | Compilador y bundler | ^4.60.2 |
| **Nodemon** | Recarga automatica durante desarrollo | ^3.1.11 |
| **tsx** | Ejecutor de TypeScript para desarrollo | ^4.7.1 |
| **ollama** | Cliente SDK para modelos locales via Ollama | ^0.6.3 |
| **openai** | Cliente oficial de OpenAI API | ^4.80.1 |
| **groq-sdk** | Cliente oficial de Groq API (chat + Whisper API) | ^0.12.0 |
| **@huggingface/transformers** | Whisper local via ONNX (sin internet tras descarga) | ^4.2.0 |
| **ogg-opus-decoder** | Decodifica OGG/Opus de WhatsApp a PCM (WASM) | ^1.7.3 |
| **ESLint** | Linter con typescript-eslint y eslint-plugin-builderbot | ^9.0.0 |

---

## Flujo de Ejecucion

### 1. Inicializacion (`src/app.ts`)

```
main()
  → createProvider(Baileys)
  → createBot({ flows, provider, database: MemoryDB })
  → bot.httpServer(PORT)
  → registra handlers SIGINT/SIGTERM para graceful shutdown
```

Al recibir SIGINT o SIGTERM (Ctrl+C o `kill`):
1. Se imprime `[shutdown] señal recibida`
2. Se arma un timer de force-exit a 3 segundos (`.unref()`) como seguridad
3. Se cierra el websocket de Baileys y se liberan archivos de sesion (best-effort)
4. `process.exit(0)`

### 2. Flujo de Texto (`src/flows/welcome.flow.ts`)

```
Usuario envia mensaje de texto a WhatsApp
    |
EVENTS.WELCOME se dispara
    |
Lee estado del usuario: state.getMyState() → { history, summary? }
    |
ConversationService.generateReply({ username, incomingText, history, summary })
    |-- agrega mensaje del usuario al historial
    |-- MessageBuilder.buildMessages(history, summary)
    |       |-- system prompt de persona
    |       |-- system prompt de resumen (si existe)
    |       |-- historial de mensajes
    |-- LLMService.generateResponse({ username, messages })
    |-- agrega respuesta del LLM al historial
    |-- si history.length > maxMessages:
    |       |-- HistorySummarizer.summarize({ previousSummary, older messages })
    |       |-- recorta history a los ultimos keepRecentMessages
    |
Respuesta se divide en chunks por oracion (splitResponseIntoChunks)
    |
Se envia cada chunk con delay aleatorio via flowDynamic
    |
state.update({ history, summary })
    |
printConversationHistory({ userId, username, history, summary, didSummarize })
```

### 3. Flujo de Voz (`src/flows/voice-note.flow.ts`)

```
Usuario envia nota de voz
    |
EVENTS.VOICE_NOTE se dispara
    |
LocalAudioStorageService.prepareUserDir(ctx.from, username)
    → crea storage/audios/<PushName>_<numero>/ si no existe
    |
provider.saveFile(ctx, { path: userDir })
    → descarga y guarda el .ogg en la carpeta del usuario
    |
TranscriptionService.transcribe(audioBuffer, mimeType)
    → 'local': Whisper ONNX corre en tu maquina
    → 'groq': Whisper vía API de Groq
    |
El texto transcrito entra al mismo pipeline de ConversationService
    (identico al flujo de texto desde ese punto)
```

Pipeline de transcripcion local:
```
OGG/Opus (WhatsApp, 48kHz)
    → ogg-opus-decoder (WASM)
    → PCM mono
    → downsample a 16kHz
    → Whisper ONNX
    → texto en español
```

---

## Componentes Clave

### `src/app.ts` — Entrada y Ciclo de Vida

Inicializa el bot, el proveedor Baileys, la base de datos en memoria (MemoryDB) y el servidor HTTP (Polka, por defecto puerto 3008). Registra handlers de señales para cierre limpio:

```typescript
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
```

El `shutdown()` es idempotente (guard `isShuttingDown`), hace cleanup best-effort del websocket y sale con codigo 0. Si el cleanup no termina en 3 segundos, el timer de seguridad fuerza `process.exit(1)`.

---

### `src/flows/` — Capa de Orquestacion

Los flows son la capa delgada de BuilderBot. Solo leen el estado del usuario, delegan al servicio de negocio y persisten el nuevo estado. No contienen logica de negocio.

**`welcome.flow.ts`**: responde a `EVENTS.WELCOME` (cualquier mensaje de texto).
**`voice-note.flow.ts`**: responde a `EVENTS.VOICE_NOTE` (nota de voz).

Ambos comparten el mismo patron de estado:
```typescript
const { history = [], summary } = state.getMyState() ?? {}
// ... generateReply ...
await state.update({ history: nextHistory, summary: nextSummary })
```

---

### `src/features/chat/` — Feature de Conversacion

#### `conversation.service.ts`
Servicio principal. Recibe texto entrante + historial + resumen, llama al LLM, y decide si se debe resumir:

```typescript
interface ConversationReplyInput {
    username: string;
    incomingText: string;
    history: ChatMessage[];
    summary?: string;
}

interface ConversationReplyResult {
    response: string;
    history: ChatMessage[];
    summary?: string;
    didSummarize: boolean;
}
```

#### `history-summarizer.service.ts`
Reutiliza el mismo LLM configurado para generar un resumen conciso de los mensajes mas antiguos, integrando el resumen previo si existe. No requiere cambios en `ILLMService`.

#### `message.builder.ts`
Ensambla el array de mensajes para el LLM:
```
[system: persona] + [system: resumen?] + [...history]
```
Si `USES_MODELFILE=true`, omite el system prompt de persona (el modelo ya lo tiene integrado).

#### `prompt.builder.ts`
Define la personalidad del bot: responde en español de Mexico, tono casual tipo WhatsApp, nombre "Giovanni / Gio", sin emojis ni puntuacion excesiva.

#### `types/chat-message.ts`
```typescript
type ChatRole = 'system' | 'user' | 'assistant';
interface ChatMessage { role: ChatRole; content: string; }
```

#### `types/conversation-state.ts`
```typescript
interface ConversationState {
    history: ChatMessage[];
    summary?: string;
}
```

#### `utils/print-history.ts`
Imprime en consola el historial completo del usuario con separadores, conteo de mensajes, resumen acumulado y marca cuando se aplico un resumen. Se activa con `HISTORY_LOG_ENABLED=true`.

#### `utils/split-response.ts`
Divide la respuesta del LLM en oraciones individuales (split por `.` sin lookbehind de digitos) para enviarlas como mensajes separados en WhatsApp.

---

### `src/features/llm/` — Feature de Modelos de Lenguaje

#### `interfaces/llm-service.interface.ts`
```typescript
interface ILLMService {
    generateResponse(input: { username: string; messages: ChatMessage[] }): Promise<string>;
}
```

#### `factories/llm.factory.ts`
Selecciona el servicio segun `LLM_MODE` y `LLM_PROVIDER` en `appConfig`. No requiere modificaciones al agregar un nuevo proveedor si se sigue el patron.

#### Adapters
- **`ollama-llm.service.ts`**: usa `client.chat({ model, messages })` del SDK `ollama`.
- **`openai-llm.service.ts`**: usa `client.chat.completions.create({ model, messages })` del SDK `openai`.
- **`groq-llm.service.ts`**: usa `client.chat.completions.create({ model, messages })` del SDK `groq-sdk`.

---

### `src/features/voice/` — Feature de Voz

#### Interfaces
```typescript
// transcription.interface.ts
interface ITranscriptionService {
    transcribe(audioBuffer: Buffer, mimeType?: string): Promise<string>;
}

// audio-storage.interface.ts
interface IAudioStorageService {
    prepareUserDir(userId: string, username: string): Promise<string>;
}
```

#### Factories
- **`transcription.factory.ts`**: selecciona local o Groq segun `VOICE_MODE` / `TRANSCRIPTION_PROVIDER`.
- **`audio-storage.factory.ts`**: crea `LocalAudioStorageService` (unico backend actual).

#### Servicios de Transcripcion

| Proveedor | Variable | Como funciona |
|---|---|---|
| **Local (default)** | `TRANSCRIPTION_PROVIDER=local` | Whisper ONNX via `@huggingface/transformers`. El modelo se descarga a `storage/models/` la primera vez. Sin internet ni API keys despues de la descarga. |
| **Groq API** | `TRANSCRIPTION_PROVIDER=groq` | Whisper (`whisper-large-v3-turbo`) via API de Groq. Muy rapido, requiere `GROQ_API_KEY`. |

#### Almacenamiento de Audios

- Carpeta base: `storage/audios/` (ignorada por git)
- Una subcarpeta por remitente: `<pushName>_<numero>` (sanitizado a `[a-zA-Z0-9_-]`)
- Nombre de archivo: generado por `provider.saveFile` (`file-<timestamp>.ogg`)
- Ejemplo: `storage/audios/Giovanni_5215512345678/file-1718175800000.ogg`

---

### `src/shared/config/app-config.ts` — Configuracion Centralizada

Validacion fail-fast al iniciar: si falta una variable requerida, el proceso falla con un mensaje claro antes de intentar conectarse a nada. Bloques:

- `server`: puerto HTTP
- `chat.history`: parametros de resumen y logging del historial
- `llm`: modo, proveedor, credenciales y modelos para los tres proveedores
- `voice`: modo, proveedor de transcripcion y directorio de audios
- `reply`: delays minimo y maximo para enviar chunks

---

## Configuracion por Modo

### General

```env
PORT=3008
LLM_MODE=local
VOICE_MODE=local
REPLY_MIN_DELAY_MS=3000
REPLY_MAX_DELAY_MS=15000
```

### Historial y Resumen

```env
HISTORY_SUMMARY_ENABLED=true
HISTORY_MAX_MESSAGES=20
HISTORY_KEEP_RECENT=8
HISTORY_LOG_ENABLED=true
```

### LLM Local (Ollama)

```env
LLM_MODE=local
LLM_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest
USES_MODELFILE=false
```

- `OLLAMA_MODEL` es la variable recomendada. `AI_MODEL` se mantiene como alias legacy.
- `USES_MODELFILE=true` omite el system prompt de persona (el modelo ya lo tiene integrado via Modelfile).

### LLM Cloud — OpenAI

```env
LLM_MODE=cloud
LLM_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
```

### LLM Cloud — Groq

```env
LLM_MODE=cloud
LLM_PROVIDER=groq
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile
```

### Voz Local (Whisper ONNX)

```env
VOICE_MODE=local
TRANSCRIPTION_PROVIDER=local
WHISPER_MODEL=Xenova/whisper-small
MODEL_CACHE_DIR=storage/models
```

### Voz Cloud (Groq Whisper)

```env
VOICE_MODE=cloud
TRANSCRIPTION_PROVIDER=groq
GROQ_API_KEY=...
GROQ_TRANSCRIPTION_MODEL=whisper-large-v3-turbo
```

### Storage

```env
AUDIO_STORAGE_DIR=storage/audios
```

---

## Reglas de Validacion (Fail-Fast)

- `LLM_MODE=local` fuerza `LLM_PROVIDER=ollama`.
- `LLM_MODE=cloud` exige `LLM_PROVIDER=openai|groq`.
- `LLM_MODE=cloud` + `LLM_PROVIDER=openai` exige `OPENAI_API_KEY` y `OPENAI_MODEL`.
- `LLM_MODE=cloud` + `LLM_PROVIDER=groq` exige `GROQ_API_KEY` y `GROQ_MODEL`.
- `VOICE_MODE=local` fuerza `TRANSCRIPTION_PROVIDER=local`.
- `VOICE_MODE=cloud` exige `GROQ_API_KEY` y `GROQ_TRANSCRIPTION_MODEL`.
- `REPLY_MIN_DELAY_MS` debe ser menor o igual a `REPLY_MAX_DELAY_MS`.
- `HISTORY_KEEP_RECENT` debe ser menor que `HISTORY_MAX_MESSAGES`.
- Si alguna condicion no se cumple, el bot falla al iniciar con un mensaje de error claro.

---

## Comandos

```bash
pnpm install                                          # Instalar dependencias
pnpm run dev                                          # Lint + nodemon en desarrollo
pnpm run lint                                         # ESLint
pnpm run build                                        # Compilar con Rollup a dist/
pnpm start                                            # Ejecutar desde dist/app.js
pnpm run clean:macos                                  # Matar proceso en :3008 y limpiar sesion
pnpm run clean:linux                                  # Equivalente en Linux
npx tsx scripts/test-whisper.ts <ruta-al-audio.ogg>   # Probar transcripcion local
```

---

## Como Agregar Features

### Nuevo Proveedor LLM

1. Crear `src/features/llm/services/<nombre>-llm.service.ts` implementando `ILLMService`:
   ```typescript
   export class NuevoLLMService implements ILLMService {
       async generateResponse({ username, messages }: GenerateResponseInput): Promise<string> {
           // llamada al SDK del proveedor
       }
   }
   ```
2. Agregar el nuevo proveedor como opcion en `LLMProvider` en `app-config.ts`.
3. Agregar las variables de configuracion y validacion fail-fast correspondientes.
4. Registrar en `src/features/llm/factories/llm.factory.ts`.

### Nuevo Proveedor de Transcripcion

1. Crear `src/features/voice/services/<nombre>-transcription.service.ts` implementando `ITranscriptionService`:
   ```typescript
   export class NuevoTranscriptionService implements ITranscriptionService {
       async transcribe(audioBuffer: Buffer, mimeType?: string): Promise<string> {
           // llamada al proveedor
       }
   }
   ```
2. Agregar la opcion en `TranscriptionProvider` y en la validacion de `app-config.ts`.
3. Registrar en `src/features/voice/factories/transcription.factory.ts`.

### Nuevo Flow

1. Crear `src/flows/<nombre>.flow.ts` usando el patron:
   ```typescript
   export const nuevoFlow = addKeyword(EVENTS.ALGÚN_EVENTO).addAction(
       async (ctx, { flowDynamic, state }) => {
           const { history = [], summary } = state.getMyState() ?? {}
           const username = ctx?.pushName ?? 'Usuario'
           const { response, history: nextHistory, summary: nextSummary, didSummarize } =
               await conversationService.generateReply({ username, incomingText: ctx.body, history, summary })
           for (const chunk of splitResponseIntoChunks(response)) {
               await flowDynamic(chunk)
           }
           await state.update({ history: nextHistory, summary: nextSummary })
           printConversationHistory({ userId: ctx.from, username, history: nextHistory, summary: nextSummary, didSummarize })
       }
   )
   ```
2. Registrar en `src/flows/index.ts` (los flows mas especificos van antes que `welcomeFlow`).

---

## Referencias de Archivos

- [app.ts](../src/app.ts) — Entrada y graceful shutdown
- [flows/index.ts](../src/flows/index.ts) — Registro de flows
- [flows/welcome.flow.ts](../src/flows/welcome.flow.ts) — Flow de texto
- [flows/voice-note.flow.ts](../src/flows/voice-note.flow.ts) — Flow de voz
- [features/chat/services/conversation.service.ts](../src/features/chat/services/conversation.service.ts) — Orquestador principal
- [features/chat/services/history-summarizer.service.ts](../src/features/chat/services/history-summarizer.service.ts) — Resumen automatico
- [features/chat/builders/message.builder.ts](../src/features/chat/builders/message.builder.ts) — Construccion de prompts
- [features/chat/builders/prompt.builder.ts](../src/features/chat/builders/prompt.builder.ts) — Personalidad del bot
- [features/chat/utils/print-history.ts](../src/features/chat/utils/print-history.ts) — Logging de historial
- [features/llm/interfaces/llm-service.interface.ts](../src/features/llm/interfaces/llm-service.interface.ts) — Interfaz LLM
- [features/llm/factories/llm.factory.ts](../src/features/llm/factories/llm.factory.ts) — Selector de proveedor LLM
- [features/voice/interfaces/transcription.interface.ts](../src/features/voice/interfaces/transcription.interface.ts) — Interfaz de transcripcion
- [features/voice/interfaces/audio-storage.interface.ts](../src/features/voice/interfaces/audio-storage.interface.ts) — Interfaz de almacenamiento
- [features/voice/factories/transcription.factory.ts](../src/features/voice/factories/transcription.factory.ts) — Selector local/Groq
- [features/voice/services/local-whisper-transcription.service.ts](../src/features/voice/services/local-whisper-transcription.service.ts) — Whisper local
- [features/voice/services/groq-transcription.service.ts](../src/features/voice/services/groq-transcription.service.ts) — Whisper via Groq
- [shared/config/app-config.ts](../src/shared/config/app-config.ts) — Configuracion centralizada

---

## Enlaces Utiles

- [BuilderBot Documentation](https://builderbot.vercel.app/)
- [Baileys (WhatsApp library)](https://github.com/WhiskeySockets/Baileys)
- [Ollama](https://ollama.ai/)
- [OpenAI API](https://platform.openai.com/)
- [Groq API](https://console.groq.com/)
- [Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js)
- [TypeScript Documentation](https://www.typescriptlang.org/)
