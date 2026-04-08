import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { dynamicImport } from './dynamicImport.js';
import type { Bundle, Generator, FixedCodeConfig } from '../types.js';
import { BundleNotFoundError, BundleLoadError } from '../errors.js';

/**
 * Resolve the on-disk directory for a bundle given its config path.
 * Handles npm scoped packages (@scope/name) and relative paths.
 */
export function resolveBundleDir(bundlePath: string, configDir: string): string {
  if (bundlePath.startsWith('@')) {
    const fromNodeModules = resolve(configDir, 'node_modules', ...bundlePath.split('/'));
    return existsSync(fromNodeModules) ? fromNodeModules : resolve(configDir, bundlePath);
  }
  return resolve(configDir, bundlePath);
}

export async function resolveBundle(kind: string, config: FixedCodeConfig): Promise<Bundle> {
  const bundlePath = config.bundles[kind];

  if (!bundlePath) {
    throw new BundleNotFoundError(kind);
  }

  try {
    const module = await dynamicImport(bundlePath, config.configDir) as { default?: Record<string, unknown> };
    const bundle = module.default ?? module as Record<string, unknown>;

    if (!bundle.kind) {
      throw new BundleLoadError(bundlePath, "Bundle must have a 'kind' property");
    }
    if (!bundle.enrich) {
      throw new BundleLoadError(bundlePath, "Bundle must have an 'enrich' function");
    }
    if (!bundle.templates) {
      throw new BundleLoadError(bundlePath, "Bundle must have a 'templates' property");
    }

    return bundle as unknown as Bundle;
  } catch (err) {
    if (err instanceof BundleNotFoundError || err instanceof BundleLoadError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new BundleLoadError(bundlePath, message);
  }
}

export async function resolveGenerators(config: FixedCodeConfig): Promise<Generator[]> {
  const generators: Generator[] = [];
  for (const [name, genPath] of Object.entries(config.generators ?? {})) {
    try {
      const module = await dynamicImport(genPath, config.configDir) as { default?: Record<string, unknown> };
      const gen = module.default ?? module as Record<string, unknown>;
      if (typeof gen.generate !== 'function') {
        console.warn(`Generator '${name}' at ${genPath} has no generate() function, skipping`);
        continue;
      }
      generators.push({ name: (gen.name as string) ?? name, generate: gen.generate as Generator['generate'] });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`Failed to load generator '${name}' from ${genPath}: ${message}`);
    }
  }
  return generators;
}