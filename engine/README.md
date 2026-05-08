# @fixedcode/engine

The FixedCode CLI and programmatic API.

## Install

```bash
npm install -g @fixedcode/engine
# or
npm install --save-dev @fixedcode/engine
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
} from '@fixedcode/engine';

await generate({
  specPath: './workspace-domain.yaml',
  outputDir: './build',
});
```

Full type definitions live in [`engine/src/types.ts`](src/types.ts).

## Documentation

- [Architecture & contracts](../docs/architecture.md)
- [Writing a bundle](../docs/bundles.md)
- [Writing a generator](../docs/generators.md)
- [LLM configuration](../docs/llm.md)

## License

[Apache-2.0](../LICENSE)
