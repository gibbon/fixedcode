import { resolve, isAbsolute, join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

export async function dynamicImport(bundlePath: string, configDir: string): Promise<unknown> {
  let resolvedPath: string;

  if (bundlePath.startsWith('@')) {
    // For scoped npm packages, resolve from the config directory's node_modules
    const fromConfigDir = join(configDir, 'node_modules', ...bundlePath.split('/'));
    if (existsSync(fromConfigDir)) {
      resolvedPath = fromConfigDir;
    } else {
      // Fall back to Node's native resolution (works if engine is in the same project)
      resolvedPath = bundlePath;
    }
  } else if (isAbsolute(bundlePath)) {
    resolvedPath = bundlePath;
  } else {
    resolvedPath = resolve(configDir, bundlePath);
  }

  if (existsSync(join(resolvedPath, 'package.json'))) {
    const pkg = JSON.parse(readFileSync(join(resolvedPath, 'package.json'), 'utf-8'));
    let entry: string = 'src/index.js';
    if (typeof pkg.main === 'string') {
      entry = pkg.main;
    } else if (typeof pkg.exports === 'string') {
      entry = pkg.exports;
    } else if (typeof pkg.exports === 'object' && pkg.exports !== null) {
      const dotEntry = (pkg.exports as Record<string, unknown>)['.'];
      if (typeof dotEntry === 'string') entry = dotEntry;
      else if (typeof dotEntry === 'object' && dotEntry !== null) {
        entry = (dotEntry as Record<string, string>).import ?? (dotEntry as Record<string, string>).default ?? entry;
      }
    }
    if (entry.startsWith('.')) {
      resolvedPath = resolve(resolvedPath, entry);
    } else {
      resolvedPath = join(resolvedPath, entry);
    }
  } else if (existsSync(resolve(resolvedPath, 'src/index.js'))) {
    resolvedPath = resolve(resolvedPath, 'src/index.js');
  }

  return import(resolvedPath);
}