import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import bundle from '../../bundles/spring-domain/src/index.js';
import { generator } from '../../generators/openapi/src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const specYaml = readFileSync(resolve(__dirname, 'workspace-domain.yaml'), 'utf-8');
const spec = parseYaml(specYaml);

const ctx = bundle.enrich(spec.spec, { name: spec.metadata.name, apiVersion: spec.apiVersion });

const adapter = bundle.adapters?.openapi;
if (!adapter) throw new Error('No openapi adapter on spring-domain bundle');
const input = adapter(ctx);
const files = generator.generate(input);

const outDir = resolve(__dirname, 'build');
mkdirSync(outDir, { recursive: true });

for (const file of files) {
  const outPath = resolve(outDir, file.path);
  writeFileSync(outPath, file.content, 'utf-8');
  console.log(`OpenAPI spec written to: ${outPath}`);
  console.log(`\n--- Preview (first 80 lines) ---\n`);
  console.log(file.content.split('\n').slice(0, 80).join('\n'));
}
