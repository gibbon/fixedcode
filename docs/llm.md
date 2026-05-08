# LLM Integration

Two FixedCode commands talk to a language model:

- **`fixedcode draft <kind> "<description>" -o <out.yaml>`** — turns a prose description into a YAML spec.
- **`fixedcode enrich <outputDir>`** — fills in extension-point business logic in already-generated code.

Both are opt-in. All other commands are deterministic and offline.

## Configuration

In `.fixedcode.yaml`:

```yaml
llm:
  provider: openrouter           # openrouter | openai | ollama
  model: google/gemini-2.5-flash
  baseUrl: https://openrouter.ai/api/v1   # optional; defaults per provider
  apiKeyEnv: OPENROUTER_API_KEY
```

Override priority: **CLI flags > env vars > `.fixedcode.yaml`**.

Env vars:

- `FIXEDCODE_LLM_PROVIDER`
- `FIXEDCODE_LLM_MODEL`
- `FIXEDCODE_LLM_BASE_URL`
- `FIXEDCODE_LLM_API_KEY`

## Trust boundaries

The LLM endpoint sees:

- Your spec YAML (for `draft`: just the prompt; for `enrich`: spec values)
- The contents of files at extension points and their neighbours (`enrich` only)
- The configured API key as Bearer auth

If you don't want this content uploaded, don't run `enrich`.

The `enrich` command prints a banner at session start listing the LLM endpoint, the file count, and the trust assumption. Always review changes via `git diff` before committing.

## `baseUrl` allowlist

To prevent crafted `.fixedcode.yaml` files from exfiltrating your code and credentials to an attacker-controlled endpoint, the engine validates `baseUrl` against an allowlist of known providers:

- `openrouter.ai`
- `api.openai.com`
- `api.anthropic.com`
- `localhost`, `127.0.0.1`, `[::1]` (loopback for local model servers like Ollama)

Plain HTTP is rejected unless the host is loopback. To extend the allowlist for self-hosted endpoints, edit `ALLOWED_LLM_HOSTS` in `engine/src/engine/llm.ts` and rebuild.

## LLM-output handling

- **`draft`** — parses the LLM response as YAML and validates it against the bundle's schema. On validation failure, retries once. If retry fails, the command aborts.
- **`enrich`** — extracts the code block from the LLM response (strips ``` fences) and writes it to the extension-point file **verbatim**. Lightweight guards: empty response is rejected; oversized response (>512 KB) is rejected; the manifest's hash check reverts unmodified files. **AST-based validation is not yet implemented** (tracked in [#8](https://github.com/gibbon/fixedcode/issues/8)). The mitigation is the AI-sandwich workflow: extension points are user-owned, every change is reviewed via `git diff`, and the engine refuses to enrich on a dirty working tree (override with `--force`).

## Prompt-injection caveat

User-supplied spec values and file contents are inlined into the LLM prompt. A spec value that looks like instructions (e.g. `note: "ignore previous instructions and ..."`) can confuse the model. This is an inherent LLM risk we acknowledge but don't fully mitigate in v0.2.0; tracked in [#6](https://github.com/gibbon/fixedcode/issues/6).

## Tests

LLM integration in tests uses a mocked client by default — vitest tests don't make network calls and don't require an API key. Integration tests against a real provider are gated behind an env var.
