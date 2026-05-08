# Security Policy

## Supported versions

The current minor (`0.2.x`) is supported. Older versions are not.

| Version | Supported |
|---------|-----------|
| 0.2.x   | ✅        |
| < 0.2   | ❌        |

## Reporting a vulnerability

Please email **security@fixedcode.dev** with details. Do not open a public issue.

We aim to acknowledge within 72 hours and ship a fix within 30 days for high-severity issues. For critical issues we will publish a coordinated disclosure timeline once the report is triaged.

## Threat model (summary)

FixedCode is a CLI run by a developer on their own machine. Trust boundaries:

- **Specs are user-provided input.** They drive file paths, template rendering, and (for `enrich`) LLM prompts. The engine treats spec values as untrusted: file outputs are constrained to the project's output directory, and template rendering uses HTML-safe defaults except where explicitly noted.
- **LLM responses are untrusted.** The `draft` command parses LLM output as YAML and validates it against the bundle's schema before writing. The `enrich` command writes LLM output verbatim to extension-point files, but prints a banner reminding the user to review changes via `git diff` before committing. AST-level validation of LLM output is tracked in [issue #8](https://github.com/gibbon/fixedcode/issues/8) for a future release.
- **The registry install path** runs `npm install` against package names that are validated against an allowlist regex (npm-style names plus `github:owner/repo[#ref]`). Arguments are passed as an array to `execFileSync`, never a shell string.
- **The LLM `baseUrl`** is validated against an allowlist of known providers (OpenRouter, OpenAI, Anthropic) plus loopback hosts (localhost, 127.0.0.1, [::1]) for local model servers.

For a full list of identified findings and their resolution, see `docs/superpowers/specs/2026-05-08-security-findings.md`.
