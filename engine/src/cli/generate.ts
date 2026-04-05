import { Command } from 'commander';
import { generate } from '../engine/pipeline.js';
import { resolveSpecPath } from './spec-resolver.js';

export function createGenerateCommand() {
  return new Command('generate')
    .alias('g')
    .description('Generate code from a domain spec')
    .argument('[name]', 'Spec name (without .yaml extension)')
    .argument('[output]', 'Output directory (default: ./build)')
    .option('-s, --spec <path>', 'Explicit spec file path')
    .option('--dry-run', 'Preview changes without writing files')
    .option('--diff', 'Show differences between generated and existing files')
    .option('-o, --output <dir>', 'Output directory')
    .action(async (name: string | undefined, output: string | undefined, opts) => {
      if (!name && !opts.spec) {
        console.error('Error: specify a spec name or use --spec');
        process.exit(1);
      }

      const specPath = opts.spec ?? resolveSpecPath(name!);
      const outputDir = opts.output ?? output;

      try {
        await generate(specPath, { outputDir, dryRun: opts.dryRun, diff: opts.diff });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Generate failed: ${message}`);
        process.exit(1);
      }
    });
}