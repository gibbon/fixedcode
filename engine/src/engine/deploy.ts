/**
 * Deploy pipeline: copies build output into a downstream project's source tree.
 * Smart migration handling — skips versioned migrations if already deployed.
 * Bundle-agnostic: copies the full build directory structure without assuming
 * any particular project layout.
 */
import { resolve, relative, dirname } from 'node:path';
import { existsSync, readdirSync, mkdirSync, copyFileSync } from 'node:fs';

export interface DeployOptions {
  /** Build output directory (source) */
  buildDir: string;
  /** Target project directory */
  targetDir: string;
  /** Preview without writing */
  dryRun?: boolean;
}

export interface DeployResult {
  targetDir: string;
  filesCopied: number;
  filesSkipped: number;
}

export function deploy(options: DeployOptions): DeployResult {
  const buildDir = resolve(options.buildDir);
  const targetDir = resolve(options.targetDir);

  if (!existsSync(buildDir)) {
    throw new Error(`Build directory not found: ${buildDir}`);
  }

  const result = copyDirectoryWithMigrationAwareness(buildDir, targetDir, options.dryRun ?? false);

  if (result.copied > 0) {
    console.log(`  Deployed ${result.copied} files to ${targetDir}`);
  }
  if (result.skipped > 0) {
    console.log(`  Skipped ${result.skipped} files (migration already exists)`);
  }

  return { targetDir, filesCopied: result.copied, filesSkipped: result.skipped };
}

function copyDirectoryWithMigrationAwareness(
  srcDir: string,
  dstDir: string,
  dryRun: boolean,
): { copied: number; skipped: number } {
  let copied = 0;
  let skipped = 0;

  if (!existsSync(srcDir)) return { copied, skipped };

  const walk = (dir: string) => {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = resolve(dir, entry.name);
      const relPath = relative(srcDir, srcPath);
      const dstPath = resolve(dstDir, relPath);

      if (entry.isDirectory()) {
        walk(srcPath);
      } else if (entry.isFile()) {
        // Smart migration handling: skip versioned SQL migrations if target already has them
        if (
          relPath.includes('migration') &&
          entry.name.startsWith('V0') &&
          entry.name.endsWith('.sql')
        ) {
          if (existsSync(dstPath)) {
            skipped++;
            continue;
          }
        }

        if (dryRun) {
          console.log(`[DRY RUN] Would copy: ${relPath}`);
          copied++;
        } else {
          mkdirSync(dirname(dstPath), { recursive: true });
          copyFileSync(srcPath, dstPath);
          copied++;
        }
      }
    }
  };

  walk(srcDir);
  return { copied, skipped };
}
