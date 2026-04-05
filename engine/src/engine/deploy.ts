/**
 * Deploy pipeline: copies build output into a downstream project's source tree.
 * Smart migration handling — skips V002 if already deployed (incremental mode).
 */
import { resolve, relative, dirname } from 'node:path';
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, statSync, copyFileSync } from 'node:fs';

export interface DeployOptions {
  /** Build output directory (source) */
  buildDir: string;
  /** Target project's src/ directory */
  targetDir: string;
  /** Clean target package directory before deploying */
  clean?: boolean;
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

  let filesCopied = 0;
  let filesSkipped = 0;

  // Copy plan: source → target mappings
  const copyPlan: Array<{ src: string; dst: string; label: string }> = [
    { src: resolve(buildDir, 'src/main/kotlin'), dst: resolve(targetDir, 'src/main/kotlin'), label: 'main sources' },
    { src: resolve(buildDir, 'src/test/kotlin'), dst: resolve(targetDir, 'src/test/kotlin'), label: 'test sources' },
    { src: resolve(buildDir, 'src/testIntegration'), dst: resolve(targetDir, 'src/testIntegration'), label: 'integration tests' },
    { src: resolve(buildDir, 'src/main/resources'), dst: resolve(targetDir, 'src/main/resources'), label: 'resources' },
    { src: resolve(buildDir, 'src/test/resources'), dst: resolve(targetDir, 'src/test/resources'), label: 'test resources' },
  ];

  // Also copy root project files (build.gradle.kts, docker-compose, etc.)
  const rootFiles = readdirSync(buildDir, { withFileTypes: true });
  for (const entry of rootFiles) {
    if (entry.isFile()) {
      copyPlan.push({
        src: resolve(buildDir, entry.name),
        dst: resolve(targetDir, entry.name),
        label: entry.name,
      });
    } else if (entry.isDirectory() && entry.name !== 'src') {
      // Copy non-src directories (gradle, scripts, config, docs, etc.)
      copyPlan.push({
        src: resolve(buildDir, entry.name),
        dst: resolve(targetDir, entry.name),
        label: entry.name,
      });
    }
  }

  for (const { src, dst, label } of copyPlan) {
    if (!existsSync(src)) continue;

    const srcStat = statSync(src);
    if (srcStat.isFile()) {
      // Single file copy
      if (options.dryRun) {
        console.log(`[DRY RUN] Would copy: ${label}`);
        filesCopied++;
      } else {
        mkdirSync(dirname(dst), { recursive: true });
        copyFileSync(src, dst);
        filesCopied++;
      }
      continue;
    }

    // Directory copy with migration awareness
    const result = copyDirectoryWithMigrationAwareness(src, dst, options.dryRun ?? false);
    filesCopied += result.copied;
    filesSkipped += result.skipped;

    if (result.copied > 0) {
      console.log(`  Deployed ${result.copied} ${label} files`);
    }
    if (result.skipped > 0) {
      console.log(`  Skipped ${result.skipped} ${label} files (already exist)`);
    }
  }

  // Copy OpenAPI spec to static resources if present
  const openapiFiles = readdirSync(buildDir).filter(f => f.includes('openapi') && f.endsWith('.yaml'));
  for (const file of openapiFiles) {
    const specSrc = resolve(buildDir, file);
    const specDst = resolve(targetDir, 'src/main/resources/static/api-core', file);
    if (options.dryRun) {
      console.log(`[DRY RUN] Would deploy OpenAPI spec: ${file}`);
    } else {
      mkdirSync(dirname(specDst), { recursive: true });
      copyFileSync(specSrc, specDst);
      console.log(`  Deployed OpenAPI spec: ${file}`);
    }
    filesCopied++;
  }

  return { targetDir, filesCopied, filesSkipped };
}

function copyDirectoryWithMigrationAwareness(
  srcDir: string,
  dstDir: string,
  dryRun: boolean
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
        // Smart migration handling: skip V002 if target already has it
        if (relPath.includes('migration') && entry.name.startsWith('V0') && entry.name.endsWith('.sql')) {
          if (existsSync(dstPath)) {
            skipped++;
            continue;
          }
        }

        if (dryRun) {
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
