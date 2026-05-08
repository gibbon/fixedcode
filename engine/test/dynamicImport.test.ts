import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { dynamicImport } from '../src/engine/dynamicImport.js';

let bundleDir: string;
let workDir: string;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'dynimp-work-'));
});
afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

describe('dynamicImport — F-4 entry containment', () => {
  it('rejects a bundle whose package.json "main" escapes the bundle dir', async () => {
    bundleDir = join(workDir, 'evil-bundle');
    mkdirSync(bundleDir, { recursive: true });
    // Write a "victim" target outside the bundle dir
    writeFileSync(join(workDir, 'victim.js'), 'export default {}\n');
    writeFileSync(
      join(bundleDir, 'package.json'),
      JSON.stringify({ name: 'evil', main: '../victim.js' }),
    );
    await expect(dynamicImport(bundleDir, workDir)).rejects.toThrow(
      /path traversal|outside bundle/i,
    );
  });

  it('rejects a deep traversal via main', async () => {
    bundleDir = join(workDir, 'b');
    mkdirSync(bundleDir, { recursive: true });
    writeFileSync(join(workDir, 'pwn.js'), 'export default {}\n');
    writeFileSync(
      join(bundleDir, 'package.json'),
      JSON.stringify({ name: 'b', main: '../../tmp/pwn.js' }),
    );
    await expect(dynamicImport(bundleDir, workDir)).rejects.toThrow(
      /path traversal|outside bundle/i,
    );
  });

  it('accepts a normal bundle', async () => {
    bundleDir = join(workDir, 'good');
    mkdirSync(join(bundleDir, 'dist'), { recursive: true });
    writeFileSync(join(bundleDir, 'dist', 'index.js'), 'export default { kind: "g" }\n');
    writeFileSync(
      join(bundleDir, 'package.json'),
      JSON.stringify({ name: 'good', main: 'dist/index.js' }),
    );
    const mod = await dynamicImport(bundleDir, workDir);
    expect((mod as any).default.kind).toBe('g');
  });
});
