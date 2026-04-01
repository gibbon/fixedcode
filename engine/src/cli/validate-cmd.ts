import { Command } from 'commander';
import { validate } from '../engine/pipeline.js';
import { resolveSpecPath } from './spec-resolver.js';

export function createValidateCommand() {
  return new Command('validate')
    .alias('v')
    .description('Validate a domain spec')
    .argument('[name]', 'Spec name (without .yaml extension)')
    .option('-s, --spec <path>', 'Explicit spec file path')
    .action(async (name: string | undefined, opts) => {
      if (!name && !opts.spec) {
        console.error('Error: specify a spec name or use --spec');
        process.exit(1);
      }

      const specPath = opts.spec ?? resolveSpecPath(name!);
      await validate(specPath);
    });
}