# WhatsApp Chatbot - Descripción General del Proyecto

## Resumen Ejecutivo

**WhatsApp Chatbot** es un servicio de automatización que conecta la API de WhatsApp con modelos de inteligencia artificial para responder automáticamente los mensajes que reciben los usuarios. El bot mantiene historial de conversación, utiliza prompts personalizados, entiende notas de voz (transcripción con Whisper) y puede cambiar fácilmente entre diferentes proveedores de modelos AI (Ollama, OpenAI, Groq).

### Propósito Principal
- Recibir mensajes de WhatsApp en tiempo real
- Entender notas de voz: transcribirlas a texto y responderlas como cualquier mensaje
- Guardar los audios recibidos organizados en una carpeta por usuario
- Mantener historial de conversación por usuario
- Generar respuestas automáticas usando un modelo de AI
- Permitir cambiar entre proveedores de AI sin reescribir la lógica de conversación

---

## Arquitectura General

```
WhatsApp API (Baileys)
    ↓
BuilderBot Framework
    ├─→ Welcome Flow (Mensajes de Texto)
    │       ├─→ Message History Manager (Historial de Conversación)
    │       ├─→ Message Builder (Construcción de Prompts)
    │       └─→ AI Service (Ollama / OpenAI / Groq)
    │               ↓
    │           Prompt Builder (Personalidad del Bot)
    │
    └─→ Voice Note Flow (Notas de Voz)
            ├─→ Audio Storage Service (storage/audios/<usuario>/)
            ├─→ Transcription Service (Groq Whisper)
            └─→ AI Service (mismo pipeline que texto)
```

---

## Estructura del Proyecto

```
src/
├── app.ts                              # Punto de entrada y configuración del bot
├── ai/
│   ├── message.builder.ts              # Construye historial y prompts del sistema
│   └── prompt.builder.ts               # Define la personalidad y estilo del bot
├── audio/                              # Módulo de audio (transcripción + almacenamiento)
│   ├── interfaces/
│   │   ├── transcription.interface.ts  # Abstracción ITranscriptionService (DIP)
│   │   └── audio-storage.interface.ts  # Abstracción IAudioStorageService (DIP)
│   ├── factories/
│   │   └── transcription.factory.ts    # Selector de proveedor: local | groq (env var)
│   └── services/
│       ├── local-whisper-transcription.service.ts  # Whisper descargado, corre local (ONNX)
│       ├── groq-transcription.service.ts   # Whisper (whisper-large-v3-turbo) vía Groq
│       └── local-audio-storage.service.ts  # Guarda audios en carpetas por usuario
├── configs/
│   └── model.config.ts                 # Configuración centralizada del modelo AI
├── flows/
│   ├── index.ts                        # Exporta todos los flujos
│   ├── welcome.flow.ts                 # Flujo principal: recibe y responde mensajes de texto
│   └── voice-note.flow.ts              # Flujo de audio: guarda, transcribe y responde notas de voz
├── services/
│   ├── ollama.service.ts               # Adaptador para Ollama (modelos locales)
│   ├── openai.service.ts               # Adaptador para OpenAI
│   └── groq.service.ts                 # Adaptador para Groq
└── types/
    └── chat-message.ts                 # Tipos TypeScript para mensajes de chat

storage/                                # (generado en runtime, ignorado por git)
├── audios/
│   └── <Usuario_Numero>/               # Una carpeta por remitente
│       └── file-<timestamp>.ogg        # Audios recibidos de ese usuario
└── models/                             # Modelos Whisper descargados (modo local)

scripts/
└── test-whisper.ts                     # Prueba manual: npx tsx scripts/test-whisper.ts <audio.ogg>
```

---

## Tecnologías Utilizadas

| Tecnología | Propósito | Versión |
|---|---|---|
| **@builderbot/bot** | Framework principal para flujos de conversación | 1.4.1 |
| **@builderbot/provider-baileys** | Proveedor WhatsApp basado en Baileys (sin API oficial) | 1.4.1 |
| **TypeScript** | Lenguaje tipado para mayor seguridad | 5.4.3 |
| **Rollup** | Compilador y bundler | 4.60.2 |
| **Nodemon** | Recarga automática durante desarrollo | 3.1.11 |
| **ollama** | Cliente SDK para modelos locales | 0.6.3 |
| **openai** | Cliente oficial de OpenAI API | 4.80.1 |
| **groq-sdk** | Cliente oficial de Groq API (chat + Whisper API) | 0.12.0 |
| **@huggingface/transformers** | Whisper local vía ONNX (transcripción sin internet) | 4.2.0 |
| **ogg-opus-decoder** | Decodifica audios OGG/Opus de WhatsApp a PCM (WASM) | 1.7.3 |
| **ESLint** | Linter y validador de código | 9.0.0 |

---

## Flujo de Ejecución

### 1. Inicialización (`src/app.ts`)
```
main() → createFlow([welcomeFlow]) → createProvider(Baileys) → createBot() → httpServer(3008)
```

- Crea el flujo de conversación
- Inicializa el proveedor de WhatsApp (Baileys)
- Configura la base de datos en memoria (`MemoryDB`)
- Inicia el servidor HTTP en puerto 3008

### 2. Recepción de Mensaje (`src/flows/welcome.flow.ts`)
```
Usuario envía mensaje a WhatsApp
    ↓
EVENTS.WELCOME se dispara
    ↓
welcomeFlow recibe contexto (ctx) con mensaje
    ↓
Historial se obtiene del state del usuario
```

### 3. Construcción del Prompt (`src/ai/message.builder.ts`)
```
history[] + AI_MODEL_CONFIG.usesModelfile
    ↓
Si usesModelfile=true → retorna solo history
Si usesModelfile=false → agrega system prompt del PromptBuilder
    ↓
messages[] listo para enviar al servicio AI
```

### 4. Llamada al Servicio AI (`src/services/*.service.ts`)
```
OllamaService / OpenAIService / GroqService
    ↓
envía messages[] al modelo
    ↓
recibe respuesta de AI
    ↓
retorna contenido de la respuesta
```

### 5. Almacenamiento y Respuesta (`src/flows/welcome.flow.ts`)
```
Historial se actualiza con:
  - Mensaje del usuario (role: 'user')
  - Respuesta de AI (role: 'assistant')
    ↓
Se guarda en state.history
    ↓
Respuesta se divide en chunks (por puntos)
    ↓
Se envía cada chunk con delay al usuario
```

### 6. Flujo de Notas de Voz (`src/flows/voice-note.flow.ts`)
```
Usuario envía nota de voz
    ↓
EVENTS.VOICE_NOTE se dispara
    ↓
LocalAudioStorageService.prepareUserDir(ctx.from, username)
    → crea storage/audios/<Usuario_Numero>/ si no existe
    ↓
provider.saveFile(ctx, { path: userDir })
    → descarga y guarda el .ogg en la carpeta del usuario
    ↓
createTranscriptionService() según TRANSCRIPTION_PROVIDER
    → 'local': Whisper descargado (ONNX) corre en tu máquina
    → 'groq': Whisper (whisper-large-v3-turbo) vía API
    ↓
El texto transcrito entra al mismo pipeline que un mensaje de texto:
historial → AI Service → chunks → respuesta al usuario
```

---

## Componentes Clave

### 1. **app.ts** - Punto de Entrada
**Responsabilidad**: Inicializar el bot, proveedor y base de datos

**Configuración**:
- Puerto: `process.env.PORT ?? 3008`
- Proveedor: Baileys con versión específica `[2, 3000, 1035824857]`
- Base de datos: MemoryDB (guardado en memoria RAM)

**Para agregar features**:
- Cambiar `MemoryDB` por una base de datos persistente (MongoDB, PostgreSQL)
- Agregar nuevos flows: `createFlow([welcomeFlow, nuevoFlow1, nuevoFlow2])`
- Configurar variables de entorno para diferentes ambientes
- Implementar middleware de autenticación

---

### 2. **flows/welcome.flow.ts** - Flujo Principal
**Responsabilidad**: Orchestrar el flujo de conversación y llamar servicios AI

**Lógica**:
1. Obtiene historial de conversación del usuario
2. Añade nuevo mensaje del usuario al historial
3. Llama al servicio AI con el historial completo
4. Divide la respuesta en chunks (por puntos)
5. Envía cada chunk con delay aleatorio (3-15 segundos)
6. Actualiza el historial con la respuesta de AI

**Para agregar features**:
- Crear nuevos flujos para otros triggers (`EVENTS.MESSAGE`, `EVENTS.DOCUMENT`, etc.)
- Implementar flujos ramificados: condiciones dinámicas por usuario
- Agregar validación de mensajes antes de enviar al AI
- Implementar rate limiting por usuario
- Agregar comandos especiales (ej: `/reset` para limpiar historial)
- Guardar conversaciones en base de datos
- Implementar contexto temporal (últimos N mensajes) en lugar de todo el historial

---

### 3. **services/** - Adaptadores de AI
**Responsabilidad**: Encapsular lógica de conexión con cada proveedor

**Patrón Común**:
```typescript
export const [Service]Service = async ({
  username,
  history,
}: {
  username: string;
  history: ChatMessage[];
}) => {
  // 1. Construir messages usando MessageBuilder
  // 2. Llamar API del proveedor
  // 3. Retornar contenido de la respuesta
  // 4. Capturar errores y retornar mensaje de error genérico
}
```

**Servicios Actuales**:
- **OllamaService**: Modelos locales, sin costo, requiere servidor local
- **OpenAIService**: Modelos cloud (GPT-3.5, GPT-4), requiere API key
- **GroqService**: Modelos open-source en cloud, muy rápido

**Para agregar features**:
- Agregar nuevo proveedor (Anthropic, HuggingFace, etc.):
  1. Crear `src/services/nuevoproveedor.service.ts`
  2. Seguir la firma de función existente
  3. Usar `MessageBuilder` para construir prompts
  4. Retornar string con la respuesta
  5. Manejar errores específicos del proveedor
- Agregar streaming de respuestas (enviar texto en tiempo real)
- Agregar retry logic con backoff exponencial
- Implementar circuit breaker para fallos de API
- Agregar métricas de latencia y costo por servicio

---

### 3.1 **Soporte de Audio (Transcripción + Almacenamiento)**
**Responsabilidad**: Entender notas de voz y archivarlas por usuario

**Arquitectura (Dependency Inversion + Factory)**:
```
voice-note.flow.ts
    ├─ depende de → ITranscriptionService (interfaz)
    │                   └─ resuelta por → transcription.factory.ts (TRANSCRIPTION_PROVIDER)
    │                           ├─ 'local' → LocalWhisperTranscriptionService (default)
    │                           └─ 'groq'  → GroqTranscriptionService
    └─ depende de → IAudioStorageService (interfaz)
                        └─ implementada por → LocalAudioStorageService
```

**Organización del módulo** (`src/audio/`): las interfaces viven en `audio/interfaces/` y las implementaciones en `audio/services/`, separando contrato de implementación.

**Interfaces**:
```typescript
// audio/interfaces/transcription.interface.ts
interface ITranscriptionService {
  transcribe(audioBuffer: Buffer, mimeType?: string): Promise<string>;
}

// audio/interfaces/audio-storage.interface.ts
interface IAudioStorageService {
  prepareUserDir(userId: string, username: string): Promise<string>;
}
```

**Almacenamiento de audios**:
- Carpeta base: `storage/audios/` (ignorada por git)
- Una subcarpeta por remitente: `<pushName>_<numero>` (saneado a `[a-zA-Z0-9_-]`)
- Nombre de archivo: `file-<timestamp>.ogg` (generado por `provider.saveFile`)
- Ejemplo: `storage/audios/Giovanni_5215512345678/file-1718175800000.ogg`

**Transcripción — dos proveedores intercambiables** (igual que Ollama vs OpenAI/Groq para el chat):

| Proveedor | Variable | Cómo funciona |
|---|---|---|
| **Local (default)** | `TRANSCRIPTION_PROVIDER=local` | Whisper corre en tu máquina vía `@huggingface/transformers` (ONNX). El modelo se descarga a `storage/models/` la primera vez. Sin internet ni API keys después de la descarga. Modelo configurable con `WHISPER_MODEL` (default `Xenova/whisper-small`). |
| **Groq API** | `TRANSCRIPTION_PROVIDER=groq` | Whisper (`whisper-large-v3-turbo`) vía API de Groq. Muy rápido, requiere `GROQ_API_KEY` e internet. |

**Pipeline del modo local**:
```
OGG/Opus (WhatsApp, 48kHz) → ogg-opus-decoder (WASM) → PCM mono → downsample a 16kHz → Whisper ONNX → texto
```
- Sin dependencias del sistema (no requiere ffmpeg ni cmake)
- Idioma forzado a español en ambos proveedores
- Prueba manual: `npx tsx scripts/test-whisper.ts <audio.ogg>`

**Para agregar features**:
- Agregar otro proveedor de transcripción: crear una clase que implemente `ITranscriptionService` y registrarla en `transcription.factory.ts` (el flujo no cambia)
- Guardar audios en cloud (S3, GCS): implementar `IAudioStorageService` con otro backend
- Agregar límite de tamaño/duración del audio antes de transcribir
- Limpiar audios antiguos con un job programado
- Guardar la transcripción junto al audio (archivo `.txt` hermano)

---

### 4. **ai/message.builder.ts** - Constructor de Prompts
**Responsabilidad**: Formatear el historial de conversación para el modelo AI

**Lógica**:
```typescript
if (AI_MODEL_CONFIG.usesModelfile) {
  return history;  // El modelo ya tiene system prompt integrado
} else {
  return [
    { role: 'system', content: promptBuilder.buildSystemPrompt() },
    ...history  // Historial del usuario
  ];
}
```

**Ventaja del patrón**:
- Reutilizable entre todos los servicios AI
- Soporta modelos con `modelfile` (Ollama) que ya tienen system prompt
- Soporta modelos sin modelfile que necesitan system prompt explícito

**Para agregar features**:
- Agregar memory management (últimos N mensajes únicamente)
- Agregar embeddings y búsqueda semántica de contexto
- Agregar summarización de historial largo
- Implementar diferentes estrategias de contexto por tipo de usuario
- Agregar metadata a cada mensaje (timestamp, tokens, modelo usado)

---

### 5. **ai/prompt.builder.ts** - Personalidad del Bot
**Responsabilidad**: Definir el system prompt que da personalidad al bot

**Características Actuales**:
- Idioma: Español de México
- Nombre: Giovanni o Gio
- Estilo: Casual, informal, como WhatsApp/Discord
- Tone: Natural, sin perfección excesiva, sin corporativo

**Instrucciones Clave**:
- Respuestas breves
- Sin emojis
- Sin signos de apertura (¿, ¡)
- Sin puntuación excesiva
- Frases cortas y naturales

**Para agregar features**:
- Crear diferentes builders para diferentes tipos de usuarios (soporte técnico, ventas, etc.)
- Implementar `PersonalityBuilder` para seleccionar personalidad por contexto
- Agregar instrucciones condicionales por tipo de pregunta
- Agregar restricciones de seguridad (no generar código malicioso, etc.)
- Implementar versionado de prompts para A/B testing

---

### 6. **configs/model.config.ts** - Configuración Central
**Responsabilidad**: Centralizar parámetros de configuración del modelo

**Parámetros Actuales**:
```typescript
AI_MODEL_CONFIG = {
  model: 'gio-chat:latest',      // Modelo a usar
  usesModelfile: true            // ¿Tiene system prompt integrado?
}
```

**Para agregar features**:
- Agregar selector de servicio: `provider: 'ollama' | 'openai' | 'groq'`
- Agregar parámetros de temperatura: `temperature: 0.7`
- Agregar max tokens: `maxTokens: 1000`
- Agregar versionado de modelos: `modelVersion: '1.0'`
- Agregar timeout: `timeout: 30000`
- Agregar validación de configuración al iniciar
- Permitir cargar config desde variables de entorno

---

### 7. **types/chat-message.ts** - Tipos de Datos
**Responsabilidad**: Definir tipos compartidos para mensajes

**Tipos Actuales**:
```typescript
type ChatRole = 'system' | 'user' | 'assistant';
interface ChatMessage {
  role: ChatRole;
  content: string;
}
```

**Para agregar features**:
- Agregar timestamps: `timestamp: Date`
- Agregar metadata: `metadata: { tokens?: number; model?: string; latency?: number }`
- Agregar IDs únicos: `id: string`
- Agregar usuario: `userId: string`
- Crear tipos para diferentes tipos de mensajes (texto, imagen, archivo)

---

## Patrón de Compatibilidad de Modelos

### Situación Actual
El proyecto implementa compatibilidad con 3 proveedores de AI, pero **la selección del servicio es manual** en `welcome.flow.ts`:

```typescript
// Actualmente está hardcodeado
const aiResponse = await OllamaService({ username, history });
```

### Cómo Cambiar de Proveedor Actualmente
1. Editar `src/flows/welcome.flow.ts`
2. Cambiar `OllamaService` por `OpenAIService` o `GroqService`
3. Recompilar y reiniciar el bot

### Mejora Recomendada: Selector Dinámico
```typescript
// src/configs/ai-provider.config.ts
export const AI_PROVIDER = process.env.AI_PROVIDER ?? 'ollama';

// src/factories/ai-service.factory.ts
export const getAIService = (provider: string) => {
  switch (provider) {
    case 'openai': return OpenAIService;
    case 'groq': return GroqService;
    case 'ollama': return OllamaService;
    default: throw new Error(`Unknown provider: ${provider}`);
  }
};

// src/flows/welcome.flow.ts
const AIService = getAIService(AI_PROVIDER);
const aiResponse = await AIService({ username, history });
```

### Ventajas
- Cambio de proveedor sin editar código
- Configuración por variable de entorno
- Fácil testing de diferentes servicios
- Escalable para agregar nuevos proveedores

---

## Cómo Implementar Futuras Features

### Agregar un Nuevo Servicio de AI

**Ejemplo: Integrar Anthropic Claude**

1. **Instalar dependencia**:
   ```bash
   npm install @anthropic-ai/sdk
   ```

2. **Crear adaptador** (`src/services/anthropic.service.ts`):
   ```typescript
   import { Anthropic } from '@anthropic-ai/sdk';
   import { MessageBuilder } from '~/ai/message.builder';
   import type { ChatMessage } from '~/types/chat-message';

   const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
   const messageBuilder = new MessageBuilder();

   export const AnthropicService = async ({
     username,
     history,
   }: {
     username: string;
     history: ChatMessage[];
   }) => {
     try {
       const messages = messageBuilder.buildMessages(history);
       const response = await client.messages.create({
         model: 'claude-3-sonnet-20240229',
         max_tokens: 1024,
         messages,
       });
       return response.content[0].type === 'text' ? response.content[0].text : '';
     } catch (error) {
       console.error('[Error en AnthropicService]', error);
       return 'tuve un problema al responder';
     }
   };
   ```

3. **Actualizar configuración** (`src/configs/model.config.ts`):
   ```typescript
   export const AI_MODEL_CONFIG = {
     model: 'claude-3-sonnet-20240229',
     usesModelfile: false,  // Claude no usa modelfile
     provider: 'anthropic',
   };
   ```

4. **Usar en flow** (`src/flows/welcome.flow.ts`):
   ```typescript
   import { AnthropicService } from '~/services/anthropic.service';
   
   const aiResponse = await AnthropicService({ username, history });
   ```

---

### Agregar un Nuevo Flujo de Conversación

**Ejemplo: Flujo de Soporte Técnico**

1. **Crear flujo** (`src/flows/support.flow.ts`):
   ```typescript
   import { addKeyword } from '@builderbot/bot';
   import { OllamaService } from '~/services/ollama.service';

   export const supportFlow = addKeyword(['ayuda', 'soporte', 'problema']).addAction(
     async (ctx, { flowDynamic, state }) => {
       try {
         const conversationHistory = state.getMyState()?.supportHistory ?? [];
         const username = ctx?.pushName ?? 'Usuario';

         conversationHistory.push({
           role: 'user',
           content: ctx.body,
         });

         // Usar un prompt específico para soporte técnico
         const aiResponse = await OllamaService({ username, history: conversationHistory });

         await flowDynamic(aiResponse);

         conversationHistory.push({
           role: 'assistant',
           content: aiResponse,
         });

         await state.update({ supportHistory: conversationHistory });
       } catch (error) {
         console.error('[Error en supportFlow]', error);
         await flowDynamic('No pude procesar tu solicitud de soporte');
       }
     }
   );
   ```

2. **Registrar flujo** (`src/flows/index.ts`):
   ```typescript
   import { createFlow } from '@builderbot/bot';
   import { welcomeFlow } from './welcome.flow';
   import { supportFlow } from './support.flow';

   export const flows = createFlow([supportFlow, welcomeFlow]);
   ```

3. **Crear prompt específico** (`src/ai/support-prompt.builder.ts`):
   ```typescript
   export class SupportPromptBuilder {
     buildSystemPrompt() {
       return `Eres un agente de soporte técnico profesional...`;
     }
   }
   ```

---

### Agregar Persistencia de Base de Datos

**Ejemplo: Usar MongoDB**

1. **Instalar dependencia**:
   ```bash
   npm install mongoose
   ```

2. **Crear modelo** (`src/models/conversation.model.ts`):
   ```typescript
   import mongoose from 'mongoose';

   const conversationSchema = new mongoose.Schema({
     userId: String,
     username: String,
     messages: [{
       role: String,
       content: String,
       timestamp: Date,
     }],
     createdAt: Date,
     updatedAt: Date,
   });

   export const Conversation = mongoose.model('Conversation', conversationSchema);
   ```

3. **Actualizar flow** (`src/flows/welcome.flow.ts`):
   ```typescript
   // Obtener del DB en lugar de state
   let conversation = await Conversation.findOne({ userId: ctx.from });
   if (!conversation) {
     conversation = new Conversation({ userId: ctx.from, messages: [] });
   }

   conversation.messages.push({ role: 'user', content: ctx.body, timestamp: new Date() });
   conversation.messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date() });

   await conversation.save();
   ```

---

### Agregar Comandos Especiales

**Ejemplo: Comando /reset**

1. **Crear flow de comandos** (`src/flows/commands.flow.ts`):
   ```typescript
   import { addKeyword } from '@builderbot/bot';

   export const commandsFlow = addKeyword(['/reset', '/limpiar']).addAction(
     async (ctx, { state, flowDynamic }) => {
       await state.update({ history: [] });
       await flowDynamic('Historial de conversación limpiado');
     }
   );
   ```

2. **Registrar el flow** (`src/flows/index.ts`):
   ```typescript
   export const flows = createFlow([commandsFlow, welcomeFlow]);
   ```

---

### Agregar Validación de Mensajes

1. **Crear middleware** (`src/middleware/validation.middleware.ts`):
   ```typescript
   export const validateMessage = (message: string): boolean => {
     if (message.length === 0) return false;
     if (message.length > 5000) return false;
     return true;
   };
   ```

2. **Usar en flow** (`src/flows/welcome.flow.ts`):
   ```typescript
   if (!validateMessage(ctx.body)) {
     await flowDynamic('Mensaje inválido');
     return;
   }
   ```
---

## Referencias de Archivos

- [app.ts](../src/app.ts) - Punto de entrada
- [welcome.flow.ts](../src/flows/welcome.flow.ts) - Flujo principal (texto)
- [voice-note.flow.ts](../src/flows/voice-note.flow.ts) - Flujo de notas de voz
- [transcription.interface.ts](../src/audio/interfaces/transcription.interface.ts) - Abstracción de transcripción
- [transcription.factory.ts](../src/audio/factories/transcription.factory.ts) - Selector local/groq
- [local-whisper-transcription.service.ts](../src/audio/services/local-whisper-transcription.service.ts) - Whisper local (ONNX)
- [groq-transcription.service.ts](../src/audio/services/groq-transcription.service.ts) - Whisper vía Groq
- [audio-storage.interface.ts](../src/audio/interfaces/audio-storage.interface.ts) - Abstracción de almacenamiento
- [local-audio-storage.service.ts](../src/audio/services/local-audio-storage.service.ts) - Carpetas por usuario
- [message.builder.ts](../src/ai/message.builder.ts) - Constructor de prompts
- [prompt.builder.ts](../src/ai/prompt.builder.ts) - Personalidad del bot
- [model.config.ts](../src/configs/model.config.ts) - Configuración
- [Services](../src/services/) - Adaptadores de AI
- [chat-message.ts](../src/types/chat-message.ts) - Tipos

---

## Enlaces Útiles

- [BuilderBot Documentation](https://builderbot.vercel.app/)
- [Ollama](https://ollama.ai/)
- [OpenAI API](https://platform.openai.com/)
- [Groq API](https://console.groq.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

---

**Última actualización**: Junio 2026
**Versión del Proyecto**: 1.0.0
