import { resolve, relative, sep } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Context } from '../types.js';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const engineVersion = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8')).version as string;
import { EnrichmentError, WriteError } from '../errors.js';
import { parseSpec, validateEnvelope } from './parse.js';
import { loadConfig } from './config.js';
import { resolveBundle, resolveGenerators, resolveBundleDir } from './resolve.js';
import { validateBody } from './validate.js';
import { renderTemplates, renderFile, createHandlebarsEnv } from './render.js';
import { writeSingleFile } from './write.js';
import { readManifest, writeManifest, hashContent, shouldWrite, loadIgnorePatterns, isIgnored, type Manifest, type ManifestEntry } from './manifest.js';

export interface GenerateOptions {
  outputDir?: string;
  dryRun?: boolean;
  diff?: boolean;
  configPath?: string;
}

export async function generate(
  specPath: string,
  options: GenerateOptions = {}
): Promise<void> {
  const specDir = resolve(specPath, '..');
  const config = loadConfig(specDir, options.configPath);
  
  const rawSpec = parseSpec(specPath);
  validateEnvelope(rawSpec);
  
  const bundle = await resolveBundle(rawSpec.kind, config);
  
  validateBody(rawSpec.spec, bundle.specSchema);
  
  const metadata = {
    name: rawSpec.metadata.name,
    description: rawSpec.metadata.description,
    apiVersion: rawSpec.apiVersion,
  };
  
  let context: Context;
  try {
    context = bundle.enrich(rawSpec.spec, metadata);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new EnrichmentError(rawSpec.kind, message);
  }

  const bundleDir = resolveBundleDir(config.bundles[bundle.kind], config.configDir);
  const templatesDir = resolve(bundleDir, bundle.templates);
  const outputDir = options.outputDir ?? resolve(specDir, 'build');
  const relativeSpecFile = relative(outputDir, resolve(specPath));

  // Load existing manifest and ignore patterns for regeneration awareness
  const existingManifest = readManifest(outputDir);
  const ignorePatterns = loadIgnorePatterns(specDir);
  const newManifestFiles: Record<string, ManifestEntry> = {};
  let skipped = 0;
  let warned = 0;

  const writeWithManifest = (relPath: string, content: string, overwrite: boolean, bundleKind: string, specFile?: string) => {
    // Path containment check: ensure resolved path stays within outputDir
    const absOut = resolve(outputDir, relPath);
    if (!absOut.startsWith(resolve(outputDir) + sep)) {
      throw new WriteError(relPath, 'Path escapes output directory');
    }

    if (isIgnored(relPath, ignorePatterns)) {
      skipped++;
      return;
    }

    const action = shouldWrite(relPath, overwrite, outputDir, existingManifest);
    if (action === 'skip') {
      skipped++;
      return;
    }
    if (action === 'warn-overwrite') {
      console.warn(`  Warning: overwriting user-modified file: ${relPath}`);
      warned++;
    }

    writeSingleFile(resolve(outputDir, relPath), content, {
      dryRun: options.dryRun,
      diff: options.diff,
    });

    newManifestFiles[relPath] = {
      hash: hashContent(content),
      bundle: bundleKind,
      overwrite,
      specFile,
    };
  };

  if (bundle.generateFiles) {
    const entries = bundle.generateFiles(context);
    const hb = createHandlebarsEnv({
      noEscape: true,
      helpers: bundle.helpers,
      partials: bundle.partials,
    });
    for (const entry of entries) {
      const absTemplatePath = resolve(bundleDir, bundle.templates, entry.template);
      const content = renderFile(absTemplatePath, entry.ctx, { noEscape: true }, hb);
      if (content.trim() !== '') {
        writeWithManifest(entry.output, content, entry.overwrite !== false, rawSpec.kind, relativeSpecFile);
      }
    }
  } else {
    const rendered = await renderTemplates(templatesDir, context, {
      noEscape: true,
      helpers: bundle.helpers,
      partials: bundle.partials,
    });
    for (const file of rendered) {
      writeWithManifest(file.path, file.content, true, rawSpec.kind, relativeSpecFile);
    }
  }

  // Run generators that have matching adapters on this bundle
  const generators = await resolveGenerators(config);
  for (const gen of generators) {
    const adapter = bundle.adapters?.[gen.name];
    if (!adapter) continue;

    const input = adapter(context);
    const files = gen.generate(input);
    for (const file of files) {
      writeWithManifest(file.path, file.content, true, `generator:${gen.name}`, relativeSpecFile);
    }
  }

  // Merge new manifest entries with existing (preserves entries from other bundle runs)
  const mergedFiles = { ...(existingManifest?.files ?? {}), ...newManifestFiles };
  if (!options.dryRun) {
    writeManifest(outputDir, {
      generatedAt: new Date().toISOString(),
      engine: engineVersion,
      bundles: { [rawSpec.kind]: engineVersion },
      files: mergedFiles,
    });
  }

  if (skipped > 0) console.log(`  Skipped ${skipped} files (extension points or ignored)`);
  if (warned > 0) console.log(`  Warning: ${warned} user-modified files were overwritten`);
}

export async function validate(specPath: string, options?: { configPath?: string }): Promise<void> {
  const specDir = resolve(specPath, '..');
  const config = loadConfig(specDir, options?.configPath);
  
  const rawSpec = parseSpec(specPath);
  validateEnvelope(rawSpec);
  
  const bundle = await resolveBundle(rawSpec.kind, config);
  validateBody(rawSpec.spec, bundle.specSchema);
  
  console.log(`Spec ${rawSpec.metadata.name} is valid.`);
}