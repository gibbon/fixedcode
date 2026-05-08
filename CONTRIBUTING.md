# Contributing to FixedCode

Thanks for thinking about contributing. FixedCode is a spec-driven, deterministic code-generation engine — same spec, same code, every time. The codebase is small and welcoming to outside changes.

## Dev setup

Requirements:
- Node.js **≥ 20**
- npm (bundled with Node)
- git

```bash
git clone git@github.com:gibbon/fixedcode.git
cd fixedcode

# install engine dependencies
cd engine && npm install && cd ..

# install each bundle/generator's deps as needed
cd bundles/spring-domain && npm install && cd ../..
```

## Project layout

```
engine/             TypeScript engine — CLI, pipeline, types
bundles/            Template packages (one npm package per bundle)
generators/         Programmatic (non-template) generators
examples/           Working examples with specs and generated output
docs/               Architecture, bundles, generators, CFR docs
.github/workflows/  CI and release pipelines
```

Each bundle and generator is a self-contained npm package with its own `package.json`, schema, templates, tests.

## Running things locally

```bash
# build the engine
cd engine && npm run build && cd ..

# run a generation against an example
node engine/bin/fixedcode.js generate path/to/your-spec.yaml -o /tmp/out

# verify the output matches the spec's expectations
node engine/bin/fixedcode.js verify path/to/your-spec.yaml /tmp/out

# run tests
cd engine && npm test
```

If you've installed the CLI globally (`npm install -g fixedcode`), the binary is `fixedcode`.

## Adding a bundle

See [`docs/bundles.md`](docs/bundles.md) for the full guide. The fast path:

1. `node engine/bin/fixedcode.js bundle init <name>` scaffolds the project structure.
2. Edit `src/index.ts` — set the `kind`, declare your spec schema, implement `enrich()`.
3. Drop Handlebars templates into `templates/`.
4. Add tests under `test/`.
5. Open a PR.

## Adding a generator

See [`docs/generators.md`](docs/generators.md). Generators differ from bundles in that they produce output programmatically, not from templates. The OpenAPI generator under `generators/openapi/` is a worked example.

## Tests

We use **vitest** across all packages. Run `npm test` from the package directory. New features should land with tests; security-sensitive changes must include regression tests.

## Commit messages

Follow Conventional Commits style. Common prefixes:
- `feat(<scope>): …` — new feature
- `fix(<scope>): …` — bug fix
- `docs: …` — docs only
- `build: …` — dependency or build-tooling changes
- `ci: …` — CI workflow changes
- `chore: …` — anything else

The `<scope>` is usually the package: `engine`, `spring-domain`, etc.

## Pull-request checklist

- [ ] CI green (typecheck, lint, test, build, smoke)
- [ ] New code has tests
- [ ] Public API changes have docs updates
- [ ] Commit messages follow the convention above
- [ ] CHANGELOG.md `[Unreleased]` section updated for user-visible changes

## Reporting bugs and asking questions

- Bugs: open an issue using the **Bug report** template.
- Feature requests: use the **Feature request** template.
- Questions: use the **Question** template (or start a discussion if your repo has them enabled).
- Security issues: see [`SECURITY.md`](SECURITY.md) — please do **not** open public issues.

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
