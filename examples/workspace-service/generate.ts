/**
 * Generate a complete workspace-service from both spring-library and spring-domain specs.
 * Usage: npx tsx examples/workspace-service/generate.ts
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

// Engine imports
import { renderTemplates } from '../../engine/src/engine/render.js';
import { renderFile } from '../../engine/src/engine/render.js';
import { writeFiles, writeSingleFile } from '../../engine/src/engine/write.js';

// Bundle imports
import libraryBundle from '../../bundles/spring-library/src/index.js';
import domainBundle from '../../bundles/spring-domain/src/index.js';
import { generateFiles as domainGenerateFiles, enrich as domainEnrich } from '../../bundles/spring-domain/src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(__dirname, 'build');

async function main() {

// --- spring-library ---
console.log('=== Generating spring-library (project skeleton) ===\n');

const libSpecYaml = readFileSync(resolve(__dirname, 'workspace-library.yaml'), 'utf-8');
const libSpec = parseYaml(libSpecYaml);
const libCtx = libraryBundle.enrich(libSpec.spec, { name: libSpec.metadata.name, apiVersion: libSpec.apiVersion });

const libTemplatesDir = resolve(__dirname, '../../bundles/spring-library/templates');
const libRendered = await renderTemplates(libTemplatesDir, libCtx, {
  noEscape: true,
  helpers: libraryBundle.helpers,
  partials: libraryBundle.partials,
});

writeFiles(libRendered, outputDir, {});
console.log(`  spring-library: ${libRendered.length} files\n`);

// --- spring-domain ---
console.log('=== Generating spring-domain (DDD domain code) ===\n');

const domSpecYaml = readFileSync(resolve(__dirname, 'workspace-domain.yaml'), 'utf-8');
const domSpec = parseYaml(domSpecYaml);
const domCtx = domainEnrich(domSpec.spec, { name: domSpec.metadata.name, apiVersion: domSpec.apiVersion });

const domEntries = domainGenerateFiles(domCtx);
const domBundleDir = resolve(__dirname, '../../bundles/spring-domain');
for (const entry of domEntries) {
  const absTemplatePath = resolve(domBundleDir, 'templates', entry.template);
  const content = renderFile(absTemplatePath, entry.ctx, { noEscape: true });
  if (content.trim() !== '') {
    writeSingleFile(resolve(outputDir, entry.output), content, {});
  }
}
console.log(`  spring-domain: ${domEntries.length} files\n`);

console.log(`=== Total: ${libRendered.length + domEntries.length} files generated to ${outputDir} ===`);

} // end main

main().catch(err => { console.error(err); process.exit(1); });
