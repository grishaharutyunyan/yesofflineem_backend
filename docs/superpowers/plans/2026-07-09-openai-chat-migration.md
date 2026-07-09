# OpenAI Chat Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the "Lea" concierge chatbot from OpenRouter (Llama via `baseURL` override) to OpenAI directly, using the Chat Completions API and the `gpt-5` model.

**Architecture:** The service already uses the official `openai` SDK with the Chat Completions shape. The migration re-points the client to `api.openai.com`, renames config `openRouter` → `openai`, applies gpt-5-specific parameter changes (`max_completion_tokens`, `reasoning_effort`), and removes now-unused provider dependencies. Tools, memory, prompt, controller, and the frontend JSON contract are unchanged.

**Tech Stack:** NestJS 10, TypeScript 5, `openai` SDK v6, `@nestjs/config`.

## Global Constraints

- Do NOT change the frontend response contract: `reply`, `session_id`, `action: 'book'`, `slug`, `eventCard`, `eventCards`.
- Do NOT modify `tools/agent.tools.ts`, `memory/memory.service.ts`, `prompt.service.ts`, `chat.controller.ts`, or any frontend file.
- Default model must be env-overridable: `OPENAI_MODEL || 'gpt-5'`.
- No test runner covers `chat.service.ts`; verification is `npm run build` + manual smoke tests (documented in the spec). There is no unit test to write for this migration.
- After changes, `grep -rniE "openrouter|groq|generative-ai" src` must return nothing.

---

### Task 1: Rename config `openRouter` → `openai` (interface + config + env)

**Files:**
- Modify: `src/constants/interfaces/global.interfaces.ts:15-18`
- Modify: `src/configs/global.configs.ts:29-32`
- Modify: `.env` (OpenRouter lines)

**Interfaces:**
- Consumes: nothing.
- Produces: config keys `openai.apiKey` (string) and `openai.model` (string), consumed by Task 2.

- [ ] **Step 1: Update the config interface**

In `src/constants/interfaces/global.interfaces.ts`, replace the `openRouter` block (lines 15-18):

```ts
  openai: {
    apiKey: string;
    model: string;
  };
```

- [ ] **Step 2: Update the config factory**

In `src/configs/global.configs.ts`, replace the `openRouter` block (lines 29-32):

```ts
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-5',
    },
```

- [ ] **Step 3: Update `.env`**

Remove the OpenRouter comment line and the two `OPENROUTER_*` lines. Add in their place:

```
# OpenAI (chat concierge)
OPENAI_API_KEY=sk-REPLACE_WITH_YOUR_KEY
OPENAI_MODEL=gpt-5
```

Preserve the real API key if migrating an existing key; otherwise leave the placeholder for the operator to fill.

- [ ] **Step 4: Verify no interface/config references to the old name remain**

Run: `grep -rniE "openRouter" src`
Expected: no output.

Note: `src/api/chat/chat.service.ts` still references `openRouter` at this point and will fail a full build until Task 2 — so do NOT build yet. Commit this config rename together with Task 2. Proceed directly to Task 2.

---

### Task 2: Re-point the OpenAI client and apply gpt-5 parameters

**Files:**
- Modify: `src/api/chat/chat.service.ts:46-51` (constructor)
- Modify: `src/api/chat/chat.service.ts:72-79` (first, tool-detection call)
- Modify: `src/api/chat/chat.service.ts:144-150` (second, streaming call)
- Modify: `src/api/chat/chat.service.ts:156-162` (no-tool-call streaming call)
- Modify: `src/api/chat/chat.service.ts:178-182` (catch block)

**Interfaces:**
- Consumes: config keys `openai.apiKey`, `openai.model` from Task 1.
- Produces: no new exported symbols; `ChatResponse` shape is unchanged.

- [ ] **Step 1: Re-point the client constructor**

Replace the constructor client setup (currently lines 46-51):

```ts
    this.openai = new OpenAI({
      apiKey: config.get<string>('openai.apiKey'),
    });
    this.model = config.get<string>('openai.model');
```

(The `baseURL: 'https://openrouter.ai/api/v1'` line is removed entirely.)

- [ ] **Step 2: Update the first (tool-detection) call**

Replace the `create` call at lines 72-79 with:

```ts
      const first = await this.openai.chat.completions.create({
        model: this.model,
        messages,
        tools: agentTools as OpenAI.Chat.Completions.ChatCompletionTool[],
        tool_choice: 'auto',
        max_completion_tokens: 1000,
        reasoning_effort: 'minimal',
        stream: false,
      });
```

- [ ] **Step 3: Update the second (streaming, post-tool) call**

Replace the `create` call at lines 145-150 with:

```ts
        const stream = await this.openai.chat.completions.create({
          model: this.model,
          messages: toolMessages,
          max_completion_tokens: 1000,
          reasoning_effort: 'minimal',
          stream: true,
        });
```

- [ ] **Step 4: Update the no-tool-call streaming call**

Replace the `create` call at lines 157-162 with:

```ts
        const stream = await this.openai.chat.completions.create({
          model: this.model,
          messages,
          max_completion_tokens: 1000,
          reasoning_effort: 'minimal',
          stream: true,
        });
```

- [ ] **Step 5: Update the catch fallback message**

In the catch block (lines 178-182), change the fallback string:

```ts
      throw new InternalServerErrorException(
        err instanceof Error ? err.message : 'OpenAI request failed',
      );
```

- [ ] **Step 6: Verify no provider references remain in `src`**

Run: `grep -rniE "openrouter|groq|generative-ai" src`
Expected: no output.

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors. If `reasoning_effort` is flagged as an unknown property by the installed `openai` types, that is a real type mismatch — resolve by confirming the `openai` SDK version supports it (v6.41 does); do not delete the parameter.

- [ ] **Step 8: Commit (config rename + client migration together)**

```bash
git add src/constants/interfaces/global.interfaces.ts src/configs/global.configs.ts src/api/chat/chat.service.ts .env
git commit -m "feat(chat): migrate Lea chatbot from OpenRouter to OpenAI gpt-5"
```

Note: confirm `.env` is not git-ignored before adding it; if it is ignored, drop it from the `git add` and leave the operator to update their own `.env`.

---

### Task 3: Remove unused provider dependencies

**Files:**
- Modify: `package.json` (dependencies)
- Modify: `package-lock.json` (regenerated by npm)

**Interfaces:**
- Consumes: confirmation from Task 2 that no `src` file imports `groq-sdk` or `@google/generative-ai`.
- Produces: nothing.

- [ ] **Step 1: Confirm the deps are unused**

Run: `grep -rniE "groq-sdk|@google/generative-ai|groq-sdk'|generative-ai'" src`
Expected: no output (already verified in Task 2, re-confirm before removing).

- [ ] **Step 2: Remove the two dependencies**

In `package.json`, delete these two lines from `dependencies`:

```json
    "@google/generative-ai": "^0.24.1",
    "groq-sdk": "^1.2.1",
```

Leave `"openai": "^6.41.0"` in place.

- [ ] **Step 3: Refresh the lockfile**

Run: `npm install`
Expected: completes; `package-lock.json` updated; `node_modules/groq-sdk` and `node_modules/@google/generative-ai` removed.

- [ ] **Step 4: Rebuild to confirm nothing broke**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(chat): drop unused groq-sdk and @google/generative-ai deps"
```

---

### Task 4: Manual smoke verification

**Files:**
- None (runtime verification only).

**Interfaces:**
- Consumes: a valid `OPENAI_API_KEY` in `.env` with `gpt-5` access.
- Produces: confirmation the migration works end-to-end.

- [ ] **Step 1: Start the server**

Run: `npm run start:dev`
Expected: Nest boots with no errors; chat module loads.

- [ ] **Step 2: Smoke test the list-events path**

Run:

```bash
curl -s -X POST http://localhost:7772/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"what events are coming up?","lang":"en"}' | head -c 2000
```

Expected: JSON with a non-empty `reply` string, a `session_id`, and a populated `eventCards` array.

- [ ] **Step 3: Smoke test session memory + booking path**

Using the `session_id` from Step 2, run (replace `<SID>`):

```bash
curl -s -X POST http://localhost:7772/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"I want to attend the first one","session_id":"<SID>","lang":"en"}' | head -c 2000
```

Expected: JSON that continues the conversation; when the model is confident about a specific event, it includes `action: "book"`, a `slug`, and an `eventCard`.

- [ ] **Step 4: If gpt-5 access errors**

If the API returns a model-access error (e.g. 404 / "model not found"), set `OPENAI_MODEL=gpt-4o-mini` (or `gpt-5-mini`) in `.env`, restart, and re-run Steps 2-3. No code change is required. Record the working model in the commit or a note.

- [ ] **Step 5: Stop the server**

Stop `npm run start:dev` (Ctrl-C). Migration complete.

---

## Notes for the implementer

- The port `7772` comes from `global.configs.ts` (`PORT || 7772`); the frontend proxies `/api/*`. If your `.env` sets a different `PORT`, use that in the curl commands.
- `reasoning_effort: 'minimal'` and `max_completion_tokens` are valid for gpt-5 and other reasoning models; on a non-reasoning fallback like `gpt-4o-mini`, `reasoning_effort` is ignored (harmless) and `max_completion_tokens` still applies.
- Do not attempt to add true HTTP streaming to the client — the endpoint intentionally returns one JSON blob; the internal stream is collected into a string. This is out of scope.