import { resolve, relative } from 'node:path';
import { existsSync } from 'node:fs';
import type { RawSpec, FixedCodeConfig, Context, RenderedFile } from '../types.js';
import { EnrichmentError } from '../errors.js';
import { parseSpec, validateEnvelope } from './parse.js';
import { loadConfig } from './config.js';
import { resolveBundle, resolveGenerators } from './resolve.js';
import { validateBody } from './validate.js';
import { renderTemplates, renderFile } from './render.js';
import { writeFiles, writeSingleFile, type WriteOptions } from './write.js';
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

  const bundlePath = config.bundles[bundle.kind];
  let bundleDir: string;
  if (bundlePath.startsWith('@')) {
    // npm scoped package — resolve from project's node_modules
    const fromNodeModules = resolve(config.configDir, 'node_modules', ...bundlePath.split('/'));
    bundleDir = existsSync(fromNodeModules) ? fromNodeModules : resolve(config.configDir, bundlePath);
  } else {
    bundleDir = resolve(config.configDir, bundlePath);
  }
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
    for (const entry of entries) {
      const absTemplatePath = resolve(bundleDir, bundle.templates, entry.template);
      const content = renderFile(absTemplatePath, entry.ctx, {
        noEscape: true,
        helpers: bundle.helpers,
        partials: bundle.partials,
      });
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

    try {
      const input = adapter(context);
      const files = gen.generate(input);
      for (const file of files) {
        writeWithManifest(file.path, file.content, true, `generator:${gen.name}`, relativeSpecFile);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`Generator '${gen.name}' failed: ${message}`);
    }
  }

  // Merge new manifest entries with existing (preserves entries from other bundle runs)
  const mergedFiles = { ...(existingManifest?.files ?? {}), ...newManifestFiles };
  if (!options.dryRun) {
    writeManifest(outputDir, {
      generatedAt: new Date().toISOString(),
      engine: '0.1.0',
      bundles: { [rawSpec.kind]: '0.1.0' },
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