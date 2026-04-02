import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { RenderedFile } from '../types.js';
import { WriteError } from '../errors.js';

export interface WriteOptions {
  dryRun?: boolean;
  diff?: boolean;
}

export function writeFiles(
  files: RenderedFile[],
  outputDir: string,
  options: WriteOptions = {}
): void {
  if (options.dryRun) {
    console.log(`[DRY RUN] Would write ${files.length} files to ${outputDir}:`);
    for (const file of files) {
      console.log(`  - ${file.path}`);
    }
    return;
  }

  for (const file of files) {
    const fullPath = join(outputDir, file.path);
    const dir = dirname(fullPath);

    try {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      if (options.diff && existsSync(fullPath)) {
        const existing = readFileSync(fullPath, 'utf-8');
        if (existing !== file.content) {
          console.log(`[DIFF] ${file.path}:`);
          console.log(existing);
          console.log('--- vs ---');
          console.log(file.content);
        }
      }

      writeFileSync(fullPath, file.content, 'utf-8');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new WriteError(fullPath, message);
    }
  }

  console.log(`Wrote ${files.length} files to ${outputDir}`);
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
