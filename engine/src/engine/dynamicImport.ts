import { resolve, isAbsolute, join, sep } from 'node:path';
import { existsSync, readFileSync, realpathSync } from 'node:fs';

/**
 * Verify the resolved entry resolves to a file under bundleDir after symlink
 * resolution. Prevents a malicious package.json from pointing outside the
 * bundle ("main": "../../evil.js"). Bundles are post-trust code (we run them
 * in-process), so this is hardening, not a perfect sandbox.
 */
function assertEntryWithinBundle(bundleDir: string, entryPath: string): void {
  const realBundle = realpathSync(bundleDir);
  // realpathSync requires the path to exist; entry might not yet — fall back to resolve().
  let realEntry: string;
  try {
    realEntry = realpathSync(entryPath);
  } catch {
    realEntry = resolve(entryPath);
  }
  if (realEntry !== realBundle && !realEntry.startsWith(realBundle + sep)) {
    throw new Error(
      `Bundle entry resolves outside bundle dir (potential path traversal): ${realEntry} not under ${realBundle}`,
    );
  }
}

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
    const bundleDir = resolvedPath;
    const pkg = JSON.parse(readFileSync(join(bundleDir, 'package.json'), 'utf-8'));
    let entry: string = 'src/index.js';
    if (typeof pkg.main === 'string') {
      entry = pkg.main;
    } else if (typeof pkg.exports === 'string') {
      entry = pkg.exports;
    } else if (typeof pkg.exports === 'object' && pkg.exports !== null) {
      const dotEntry = (pkg.exports as Record<string, unknown>)['.'];
      if (typeof dotEntry === 'string') entry = dotEntry;
      else if (typeof dotEntry === 'object' && dotEntry !== null) {
        entry =
          (dotEntry as Record<string, string>).import ??
          (dotEntry as Record<string, string>).default ??
          entry;
      }
    }
    resolvedPath = resolve(bundleDir, entry);
    assertEntryWithinBundle(bundleDir, resolvedPath);
  } else if (existsSync(resolve(resolvedPath, 'src/index.js'))) {
    resolvedPath = resolve(resolvedPath, 'src/index.js');
  }

  return import(resolvedPath);
}
