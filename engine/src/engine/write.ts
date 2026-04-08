import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { WriteError } from '../errors.js';

export interface WriteOptions {
  dryRun?: boolean;
  diff?: boolean;
}

export function writeSingleFile(
  absPath: string,
  content: string,
  options: WriteOptions = {}
): void {
  if (options.dryRun) {
    console.log(`[DRY RUN] Would write: ${absPath}`);
    return;
  }
  const dir = dirname(absPath);
  try {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    if (options.diff && existsSync(absPath)) {
      const existing = readFileSync(absPath, 'utf-8');
      if (existing !== content) {
        console.log(`[DIFF] ${absPath}`);
        console.log(existing);
        console.log('--- vs ---');
        console.log(content);
      }
    }
    writeFileSync(absPath, content, 'utf-8');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new WriteError(absPath, message);
  }
}
