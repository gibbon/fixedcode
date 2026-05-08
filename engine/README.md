# fixedcode

The FixedCode CLI and programmatic API.

[![npm version](https://img.shields.io/npm/v/fixedcode.svg)](https://www.npmjs.com/package/fixedcode)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](https://github.com/gibbon/fixedcode/blob/master/LICENSE)
[![Node](https://img.shields.io/node/v/fixedcode.svg)](https://www.npmjs.com/package/fixedcode)

> Spec-driven, deterministic code generation for the AI era. YAML in, production code out, same spec → same code every time.

> **No LLM required.** The core engine works fully offline. Only the optional `draft` and `enrich` commands use an LLM, and only if you configure one.

Full project docs: <https://github.com/gibbon/fixedcode>

## Install

```bash
npm install -g fixedcode
# or as a dev dep:
npm install --save-dev fixedcode
```

## CLI

| Command | Description |
|---|---|
| `fixedcode generate <spec.yaml> -o <out>` | Generate code from a spec into `<out>`. |
| `fixedcode build <specDir> -o <out>` | Generate from every spec in a directory; consolidates migrations. |
| `fixedcode verify <spec.yaml> <outputDir>` | Verify every expected file exists. |
| `fixedcode deploy <buildDir> <targetDir>` | Copy generated output into a target project. |
| `fixedcode validate <spec.yaml>` | Validate a spec without generating. |
| `fixedcode draft <kind> "<description>" -o <out.yaml>` | LLM-assisted spec drafting. |
| `fixedcode enrich <outputDir>` | LLM-assisted extension-point fill-in. |
| `fixedcode registry list \| search \| install \| publish` | Discover, install, publish bundles. |
| `fixedcode cfr catalog \| suggest \| check \| report` | Cross-Functional Requirements tooling. |
| `fixedcode bundle init <name>` | Scaffold a new bundle. |

Run `fixedcode <command> --help` for full options.

## Quickstart

```bash
# install the CLI
npm install -g fixedcode

# install a bundle (registry-hosted)
fixedcode registry install spring-domain

# generate
fixedcode generate my-domain.yaml -o build
fixedcode verify my-domain.yaml build

# (optional) deploy into an existing project
fixedcode deploy build /path/to/your/project
```

## Programmatic API

```ts
import {
  generate,
  validate,
  build,
  deploy,
  verify,
  fetchRegistry,
  searchRegistry,
  installPackage,
  publishPackage,
  renderTemplates,
} from 'fixedcode';

await generate({
  specPath: './my-domain.yaml',
  outputDir: './build',
});
```

## Documentation

- [Architecture & contracts](https://github.com/gibbon/fixedcode/blob/master/docs/architecture.md)
- [Writing a bundle](https://github.com/gibbon/fixedcode/blob/master/docs/bundles.md)
- [Writing a generator](https://github.com/gibbon/fixedcode/blob/master/docs/generators.md)
- [LLM configuration](https://github.com/gibbon/fixedcode/blob/master/docs/llm.md)
- [Registry](https://github.com/gibbon/fixedcode/blob/master/docs/registry.md)
- [Cross-Functional Requirements](https://github.com/gibbon/fixedcode/blob/master/docs/cfrs.md)

## License

[Apache-2.0](https://github.com/gibbon/fixedcode/blob/master/LICENSE)
