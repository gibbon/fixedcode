import { Command } from 'commander';
import { deploy } from '../engine/deploy.js';

export function createDeployCommand() {
  return new Command('deploy')
    .alias('d')
    .description('Deploy build output into a target project source tree')
    .argument('<buildDir>', 'Build output directory')
    .argument('<targetDir>', 'Target project root directory')
    .option('--dry-run', 'Preview changes without writing files')
    .action((buildDir: string, targetDir: string, opts) => {
      try {
        const result = deploy({
          buildDir,
          targetDir,
          dryRun: opts.dryRun,
        });

        console.log(`\nDeploy complete:`);
        console.log(`  Target: ${result.targetDir}`);
        console.log(`  Files copied: ${result.filesCopied}`);
        if (result.filesSkipped > 0) {
          console.log(`  Files skipped: ${result.filesSkipped} (migrations already exist)`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Deploy failed: ${message}`);
        process.exit(1);
      }
    });
}
