# Migrate Lea Chatbot to OpenAI — Design

**Date:** 2026-07-09
**Status:** Approved
**Scope:** `yesofflineem_backend` — `src/api/chat/` + config

## Goal

Migrate the "Lea" concierge chatbot from OpenRouter (Llama-3.3-70b via the OpenAI
SDK's `baseURL` override) to **OpenAI directly**, using the **Chat Completions API**
and the **`gpt-5`** model. Clean-replace the old providers.

## Current state (analysis)

- `src/api/chat/chat.service.ts` already uses the official `openai` SDK (v6.41) but
  points the client at OpenRouter via `baseURL: 'https://openrouter.ai/api/v1'`.
- Flow is two-phase Chat Completions: (1) a non-streaming call with `tools` to detect
  `tool_calls`, then (2) a streaming call whose chunks are concatenated into a string
  and returned as one JSON blob (the endpoint is not itself streamed to the client).
- Tools (`tools/agent.tools.ts`): `list_all_events`, `get_events`, `suggest_booking`.
  These drive the frontend event cards + "Reserve your spot" button.
- Config: `openRouter.{apiKey,model}` from `OPENROUTER_API_KEY` / `OPENROUTER_MODEL`.
- `package.json` still lists unused `groq-sdk` and `@google/generative-ai`.

Because the code is already OpenAI-SDK / Chat-Completions shaped, the migration is a
client re-point + config swap + gpt-5-specific parameter adjustments + dependency
cleanup. **No changes** to tools, memory, prompt, controller, or the frontend contract
(`reply` / `session_id` / `action` / `slug` / `eventCard` / `eventCards`).

## Decisions

| Decision | Choice |
|---|---|
| API surface | Chat Completions (minimal migration) |
| Default model | `gpt-5` (env-overridable) |
| Old providers | Clean replace — remove OpenRouter config/env + unused deps |

## Changes

### 1. Config layer
- `src/constants/interfaces/global.interfaces.ts`: rename `openRouter` → `openai`
  (same `{ apiKey: string; model: string }` shape).
- `src/configs/global.configs.ts`: replace the `openRouter` block with:
  ```ts
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-5',
  },
  ```
- `.env`: remove `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` (and their comment);
  add `OPENAI_API_KEY=...` and `OPENAI_MODEL=gpt-5`.

### 2. `chat.service.ts` client
- Construct the client without `baseURL` so it targets `api.openai.com`:
  ```ts
  this.openai = new OpenAI({ apiKey: config.get<string>('openai.apiKey') });
  this.model = config.get<string>('openai.model');
  ```
- Change the catch fallback message to `'OpenAI request failed'`.

### 3. gpt-5-specific API adjustments ("do best")
gpt-5 is a reasoning model and behaves differently from the previous Llama model on
both `chat.completions.create` calls:
- **`max_tokens` → `max_completion_tokens`** — gpt-5 rejects `max_tokens`.
- **Raise the limit `400` → `1000`** — reasoning tokens draw from the completion
  budget, so a low ceiling can be consumed before any visible reply is produced.
- **Add `reasoning_effort: 'minimal'`** — keeps a concierge chatbot fast and cheap;
  gpt-5 otherwise defaults to heavier reasoning that adds latency and cost.
- Leave `temperature` unset (gpt-5 only accepts the default) and keep `tool_choice`,
  `tools`, and `stream` behavior unchanged.

Apply these to **both** the first (non-streaming, tool-detection) call and the second
(streaming) call, plus the no-tool-call streaming branch.

### 4. Dependency cleanup
- Remove `groq-sdk` and `@google/generative-ai` from `package.json` dependencies.
- Keep `openai`.
- Run `npm install` to refresh `package-lock.json`.

## Verification

1. `npm run build` — TypeScript compiles; `grep -rniE "openrouter|groq|generative-ai"
   src` returns nothing.
2. Smoke test: `POST /api/chat` with a message that should trigger `list_all_events`
   (e.g. "what events are coming up?") → response contains `reply` text and a populated
   `eventCards` array; `session_id` round-trips on a follow-up message.
3. Smoke test the booking path: a message expressing interest in a specific event →
   response contains `action: "book"`, a `slug`, and an `eventCard`.

## Risk / caveat

`gpt-5` must be enabled on the OpenAI account/key. If the API returns a model-access
error (e.g. 404), it is a **one-line `.env` change** to `gpt-5-mini` or `gpt-4o-mini`
— no code change required, since the model is env-driven. Note: if falling back to a
non-reasoning model like `gpt-4o-mini`, `reasoning_effort` is ignored (harmless) and
`max_completion_tokens` is still valid.

## Out of scope

- Migrating to the Responses API.
- True end-to-end streaming to the browser (current behavior returns one JSON blob;
  preserved as-is).
- Any frontend (`yesofflineem_frontend/components/ChatFab.tsx`) changes.