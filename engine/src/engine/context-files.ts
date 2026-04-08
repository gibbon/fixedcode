/**
 * Shared utilities for loading context files for LLM prompts.
 * Used by both draft.ts and enrich.ts.
 */
import { resolve, dirname, basename, extname, join, relative } from 'node:path';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import type { ChatContentPart } from './llm.js';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);
const SKIP_EXTENSIONS = new Set(['.pdf', '.tar', '.gz', '.bin', '.exe', '.class', '.o']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '__pycache__', '.venv', 'venv']);

/**
 * Expand a list of paths into individual files.
 * Handles: individual files, directories (recursive), and .zip files.
 */
export function expandPaths(paths: string[]): string[] {
  const files: string[] = [];

  for (const p of paths) {
    const absPath = resolve(p);
    if (!existsSync(absPath)) {
      console.warn(`Warning: context path not found, skipping: ${p}`);
      continue;
    }

    const stat = statSync(absPath);

    if (stat.isDirectory()) {
      collectFilesFromDir(absPath, files);
    } else if (extname(absPath).toLowerCase() === '.zip') {
      collectFilesFromZip(absPath, files);
    } else {
      files.push(absPath);
    }
  }

  return files;
}

function collectFilesFromDir(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFilesFromDir(fullPath, out);
    } else {
      out.push(fullPath);
    }
  }
}

function collectFilesFromZip(zipPath: string, out: string[]): void {
  const tmpDir = join(dirname(zipPath), `.fixedcode-unzip-${Date.now()}`);
  try {
    mkdirSync(tmpDir, { recursive: true });
    execFileSync('unzip', ['-qo', zipPath, '-d', tmpDir], { stdio: 'pipe' });
    collectFilesFromDir(tmpDir, out);
  } catch (err) {
    console.warn(`Warning: failed to unzip ${zipPath}: ${err instanceof Error ? err.message : 'unknown error'}`);
  } finally {
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

/**
 * Load context files and return them as chat content parts.
 * Text files become text parts, images become image_url parts (base64 data URI).
 * Accepts individual files, directories, or zip archives.
 */
export function loadContextFiles(inputPaths: string[]): ChatContentPart[] {
  const filePaths = expandPaths(inputPaths);
  const parts: ChatContentPart[] = [];

  // Find common root for relative display names
  const commonRoot = filePaths.length > 1
    ? findCommonDir(filePaths)
    : dirname(filePaths[0] ?? '');

  for (const absPath of filePaths) {
    const ext = extname(absPath).toLowerCase();
    const displayName = relative(commonRoot, absPath) || basename(absPath);

    if (IMAGE_EXTENSIONS.has(ext)) {
      const data = readFileSync(absPath);
      const base64 = data.toString('base64');
      const mime = ext === '.png' ? 'image/png'
        : ext === '.gif' ? 'image/gif'
        : ext === '.webp' ? 'image/webp'
        : 'image/jpeg';
      parts.push({
        type: 'image_url',
        image_url: { url: `data:${mime};base64,${base64}` },
      });
      parts.push({ type: 'text', text: `[Image: ${displayName}]` });
    } else if (SKIP_EXTENSIONS.has(ext) || ext === '.zip') {
      // already handled zip at expand time; skip other binaries
      continue;
    } else {
      try {
        const content = readFileSync(absPath, 'utf-8');
        parts.push({ type: 'text', text: `### ${displayName}\n\n\`\`\`\n${content}\n\`\`\`` });
      } catch {
        // binary file that lacks a known extension — skip
        continue;
      }
    }
  }

  return parts;
}

function findCommonDir(paths: string[]): string {
  if (paths.length === 0) return '';
  const segments = (p: string) => dirname(p).split('/');
  let commonParts = segments(paths[0]);
  for (const p of paths.slice(1)) {
    const parts = segments(p);
    const len = Math.min(commonParts.length, parts.length);
    let i = 0;
    while (i < len && commonParts[i] === parts[i]) i++;
    commonParts = commonParts.slice(0, i);
  }
  return commonParts.join('/') || '/';
}
