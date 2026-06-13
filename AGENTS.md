# Repository Guidelines

## Project Structure & Module Organization

This is a TypeScript BuilderBot WhatsApp chatbot. Runtime code lives in `src/`, with `src/app.ts` as the entry point. Conversation handlers stay in `src/flows/`, while feature code is organized under `src/features/chat`, `src/features/llm`, and `src/features/voice`. Shared environment loading and validation lives in `src/shared/config`. Supporting docs are in `docs/`, manual utilities are in `scripts/`, generated output is in `dist/`, and local audio/model artifacts may appear under `storage/`.

## Build, Test, and Development Commands

Use pnpm because `pnpm-lock.yaml` is committed.

- `pnpm install`: install dependencies.
- `pnpm run dev`: lint, then start `nodemon` against `src/app.ts` using `.env`.
- `pnpm run lint`: run ESLint across the repository.
- `pnpm run build`: bundle the app with Rollup into `dist/`.
- `pnpm start`: run the built app from `dist/app.js`.
- `npx tsx scripts/test-whisper.ts <audio.ogg>`: manually test local transcription.
- `pnpm run clean:macos` or `pnpm run clean:linux`: stop the bot and remove local session/QR files.

## Coding Style & Naming Conventions

Write ES module TypeScript targeting ES2022. Prefer the `~/*` path alias for imports from `src`, for example `~/features/voice/factories/transcription.factory`. Keep filenames lowercase and descriptive, following patterns such as `welcome.flow.ts`, `groq-llm.service.ts`, and `transcription.interface.ts`. ESLint uses `typescript-eslint` plus `eslint-plugin-builderbot`; several strict rules are relaxed, so favor readable explicit types at module boundaries.

## Testing Guidelines

There is no automated test script configured yet. Validate changes with `pnpm run lint` and `pnpm run build`. For audio work, run the Whisper utility with a representative `.ogg` file. If adding tests, use `*.test.ts` or `*.spec.ts`; these are excluded from `tsconfig.json` builds, so add a dedicated test runner script too.

## Commit & Pull Request Guidelines

Recent history mostly follows Conventional Commits, for example `feat: implement local whisper transcription support`, `refactor: restructure AI services`, and `docs: update AI model configuration comments`. Use a short lowercase type (`feat`, `fix`, `docs`, `refactor`, `chore`, `security`) plus an imperative summary. Pull requests should describe behavior changes, list validation commands, mention environment impacts, and include screenshots or logs when WhatsApp QR/session behavior changes.

## Security & Configuration Tips

Do not commit `.env`, API keys, downloaded models, session data, or generated logs. Keep `example.env` updated when adding required configuration. New configuration should stay grouped by `LLM_MODE` and `VOICE_MODE`, with cloud credentials and local model settings documented separately.
