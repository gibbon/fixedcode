# Registry

The registry is how community bundles and generators are discovered and installed.

## How it works

`registry.json` is the source of truth: a list of available packages with their name, kind, version, tags, and install command. The CLI fetches this index and lets you list, search, install.

Two registry modes:

- **Hosted** (default) — the CLI fetches `registry.json` from `https://raw.githubusercontent.com/fixedcode-ai/registry/main/registry.json`. PRs add or update entries.
- **Local** — if the hosted fetch fails, the CLI falls back to a `registry.json` in the current working directory. Useful for offline use and for bundle authors testing locally.

## CLI

```bash
fixedcode registry list                          # all packages
fixedcode registry list --kind generator         # filter by kind
fixedcode registry search <query>                # fuzzy match name/description/tags
fixedcode registry install <name>                # npm install + register in .fixedcode.yaml
fixedcode registry publish --kind bundle --tags "tag1,tag2"
                                                  # open a PR adding/updating your package
```

## Distribution model in v0.2.0

Currently only the **engine** (`@fixedcode/engine`) is published to npm. Bundles and generators are distributed as `github:owner/repo[#ref]` references in `registry.json` — `fixedcode registry install <name>` runs `npm install github:owner/repo` under the hood.

This is intentional for the initial OSS release: it keeps the publishing surface small and avoids 21 separate npm packages on day one. Bundles may be moved to npm in a future release if there's demand.

## Install command validation

The CLI rejects an install command that:

- isn't exactly `npm install <single-target>`,
- has a target that doesn't match either the npm package pattern (`[@scope/]name[@version-range]`) or the GitHub ref pattern (`github:owner/repo[#ref]`),
- contains `..` anywhere in the target.

This prevents a malicious or accidentally-malformed registry entry from running an arbitrary install. See [`SECURITY.md`](../SECURITY.md) for the full threat model.

## Publishing your bundle

```bash
cd my-bundle
fixedcode registry publish --kind bundle --tags "spring,kotlin"
```

This:

1. Validates `--registry-repo` (default `fixedcode-ai/registry`) against `owner/repo`.
2. Builds an entry for your package from its `package.json` (name, version, repo).
3. Clones the registry repo, branches, commits the updated `registry.json`, pushes, and opens a PR via `gh`.

Maintainers review and merge.

## Adapters and generators

Generators expose an input contract; bundles expose adapters for that contract. The registry has no special handling for adapters — they're TypeScript code shipped with the bundle. When both a bundle and a generator are registered in `.fixedcode.yaml`, the engine wires them automatically based on the adapter key matching the generator name.
