/**
 * Build pipeline: generates from multiple specs into a unified output directory.
 * Handles combining spring-library (project skeleton) + spring-domain (DDD code)
 * and consolidating per-aggregate migrations into a single V002 migration.
 */
import { resolve } from 'node:path';
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { generate } from './pipeline.js';

export interface BuildOptions {
  /** Directory containing spec files */
  specDir: string;
  /** Output directory (default: specDir/build) */
  outputDir?: string;
  /** Preview without writing */
  dryRun?: boolean;
  /** Show diffs */
  diff?: boolean;
}

export interface BuildResult {
  outputDir: string;
  specs: string[];
  totalFiles: number;
}

/**
 * Run the full build pipeline:
 * 1. Find all .yaml spec files in specDir
 * 2. Generate from each spec into the same outputDir
 * 3. Consolidate migrations
 */
export async function build(options: BuildOptions): Promise<BuildResult> {
  const specDir = resolve(options.specDir);
  const outputDir = options.outputDir ?? resolve(specDir, 'build');

  // Find all spec YAML files
  const specFiles = readdirSync(specDir)
    .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    .filter(f => !f.startsWith('.'))
    .map(f => resolve(specDir, f));

  if (specFiles.length === 0) {
    throw new Error(`No spec files found in ${specDir}`);
  }

  // Generate from each spec into the same output directory
  // Library specs should go first (project skeleton), then domain specs (DDD code)
  const librarySpecs = specFiles.filter(f => f.includes('library'));
  const domainSpecs = specFiles.filter(f => !f.includes('library'));
  const orderedSpecs = [...librarySpecs, ...domainSpecs];

  for (const specPath of orderedSpecs) {
    console.log(`Generating from: ${specPath}`);
    await generate(specPath, {
      outputDir,
      dryRun: options.dryRun,
      diff: options.diff,
    });
  }

  // Consolidate migrations if needed
  if (!options.dryRun) {
    consolidateMigrations(outputDir);
  }

  // Count total files
  const totalFiles = countFiles(outputDir);

  return {
    outputDir,
    specs: orderedSpecs.map(s => s.replace(specDir + '/', '')),
    totalFiles,
  };
}

/**
 * Consolidate per-aggregate V001 migrations into a single V002 migration.
 * Looks for multiple V001__create_*_table.sql files and combines them,
 * moving FK constraints to the end.
 */
function consolidateMigrations(outputDir: string): void {
  const migrationDirs = [
    resolve(outputDir, 'src/main/resources/db/migration/core'),
    resolve(outputDir, 'src/main/resources/db/migration'),
  ];

  for (const migDir of migrationDirs) {
    if (!existsSync(migDir)) continue;

    const files = readdirSync(migDir).filter(f => f.endsWith('.sql'));
    const v001Files = files.filter(f => f.startsWith('V001__'));

    // Only consolidate if there are multiple V001 files
    if (v001Files.length <= 1) continue;

    const tableStatements: string[] = [];
    const fkStatements: string[] = [];
    const indexStatements: string[] = [];

    for (const file of v001Files) {
      const content = readFileSync(resolve(migDir, file), 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('--')) continue;

        if (trimmed.toUpperCase().startsWith('ALTER TABLE') && trimmed.toUpperCase().includes('FOREIGN KEY')) {
          fkStatements.push(trimmed);
        } else if (trimmed.toUpperCase().startsWith('CREATE INDEX') || trimmed.toUpperCase().startsWith('CREATE UNIQUE INDEX')) {
          indexStatements.push(trimmed);
        } else {
          tableStatements.push(trimmed);
        }
      }
    }

    // Write consolidated V002
    const consolidated: string[] = [
      '-- Consolidated migration for all aggregate tables',
      '',
      ...tableStatements,
    ];

    if (fkStatements.length > 0) {
      consolidated.push('', '-- Foreign key constraints (added after all tables)', '');
      consolidated.push(...fkStatements);
    }

    if (indexStatements.length > 0) {
      consolidated.push('', '-- Indexes', '');
      consolidated.push(...indexStatements);
    }

    const outPath = resolve(migDir, 'V002__create_all_aggregate_tables.sql');
    writeFileSync(outPath, consolidated.join('\n') + '\n', 'utf-8');
    console.log(`Consolidated ${v001Files.length} migrations into ${outPath}`);
  }
}

function countFiles(dir: string): number {
  if (!existsSync(dir)) return 0;
  let count = 0;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile()) count++;
    else if (entry.isDirectory()) count += countFiles(resolve(dir, entry.name));
  }
  return count;
}
