import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { enrich } from '../../bundles/spring-domain/src/index.js';
import { generateOpenApiSpec } from '../../bundles/spring-domain/src/openapi.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const specYaml = readFileSync(resolve(__dirname, 'workspace-domain.yaml'), 'utf-8');
const spec = parseYaml(specYaml);

const ctx = enrich(spec.spec, { name: spec.metadata.name, apiVersion: spec.apiVersion });
const openapi = generateOpenApiSpec(ctx);

const outDir = resolve(__dirname, 'build');
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, 'gap-workspace-unified-openapi.yaml');
writeFileSync(outPath, openapi, 'utf-8');
console.log(`OpenAPI spec written to: ${outPath}`);
console.log(`\n--- Preview (first 80 lines) ---\n`);
console.log(openapi.split('\n').slice(0, 80).join('\n'));
