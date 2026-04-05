import { Command } from 'commander';
import { build } from '../engine/build.js';

export function createBuildCommand() {
  return new Command('build')
    .alias('b')
    .description('Generate from all specs in a directory into a unified output')
    .argument('[specDir]', 'Directory containing spec files (default: current directory)', '.')
    .option('-o, --output <dir>', 'Output directory (default: specDir/build)')
    .option('--dry-run', 'Preview changes without writing files')
    .option('--diff', 'Show differences between generated and existing files')
    .action(async (specDir: string, opts) => {
      try {
        const result = await build({
          specDir,
          outputDir: opts.output,
          dryRun: opts.dryRun,
          diff: opts.diff,
        });

        console.log(`\nBuild complete:`);
        console.log(`  Specs: ${result.specs.join(', ')}`);
        console.log(`  Output: ${result.outputDir}`);
        console.log(`  Files: ${result.totalFiles}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Build failed: ${message}`);
        process.exit(1);
      }
    });
}
