import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

const SPEC_PATTERNS = [
  '{name}.yaml',
  '{name}-domain.yaml',
  'specs/{name}.yaml',
  'specs/{name}-domain.yaml',
];

export function resolveSpecPath(name: string, cwd: string = process.cwd()): string {
  for (const pattern of SPEC_PATTERNS) {
    const path = resolve(cwd, pattern.replace('{name}', name));
    if (existsSync(path)) {
      return path;
    }
  }

  const directPath = resolve(cwd, name);
  if (existsSync(directPath)) {
    return directPath;
  }

  throw new Error(
    `Could not find spec file for '${name}'. Tried: ${SPEC_PATTERNS.map((p) => p.replace('{name}', name)).join(', ')}`,
  );
}
