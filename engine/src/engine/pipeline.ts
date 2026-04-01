import { resolve } from 'node:path';
import type { RawSpec, FixedCodeConfig, Context, RenderedFile } from '../types.js';
import { parseSpec, validateEnvelope } from './parse.js';
import { loadConfig } from './config.js';
import { resolveBundle } from './resolve.js';
import { validateBody } from './validate.js';
import { renderTemplates } from './render.js';
import { writeFiles, type WriteOptions } from './write.js';

export interface GenerateOptions {
  outputDir?: string;
  dryRun?: boolean;
  diff?: boolean;
}

export async function generate(
  specPath: string,
  options: GenerateOptions = {}
): Promise<void> {
  const specDir = resolve(specPath, '..');
  const config = loadConfig(specDir);
  
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
    throw new Error(`Enrichment failed in bundle '${rawSpec.kind}': ${message}`);
  }

  const bundleDir = resolve(config.configDir, config.bundles[bundle.kind]);
  const templatesDir = resolve(bundleDir, bundle.templates);
  
  const rendered = await renderTemplates(templatesDir, context, {
    noEscape: true,
    helpers: bundle.helpers,
    partials: bundle.partials,
  });

  const outputDir = options.outputDir ?? resolve(specDir, 'build');
  writeFiles(rendered, outputDir, { dryRun: options.dryRun, diff: options.diff });
}

export async function validate(specPath: string): Promise<void> {
  const specDir = resolve(specPath, '..');
  const config = loadConfig(specDir);
  
  const rawSpec = parseSpec(specPath);
  validateEnvelope(rawSpec);
  
  const bundle = await resolveBundle(rawSpec.kind, config);
  validateBody(rawSpec.spec, bundle.specSchema);
  
  console.log(`Spec ${rawSpec.metadata.name} is valid.`);
}