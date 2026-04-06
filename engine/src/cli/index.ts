import { Command } from 'commander';
import { createGenerateCommand } from './generate.js';
import { createValidateCommand } from './validate-cmd.js';
import { createInitCommand } from './init.js';
import { createBundleInitCommand } from './bundle-init.js';
import { createBuildCommand } from './build-cmd.js';
import { createDeployCommand } from './deploy-cmd.js';
import { createVerifyCommand } from './verify-cmd.js';
import { createRegistryCommand } from './registry-cmd.js';
import { createCfrCommand } from './cfr-cmd.js';
import { createDraftCommand } from './draft-cmd.js';
import { createEnrichCommand } from './enrich-cmd.js';

export function createProgram() {
  const program = new Command();

  program
    .name('fixedcode')
    .description('Pluggable, spec-driven code generation engine')
    .version('0.1.0');

  program.addCommand(createGenerateCommand());
  program.addCommand(createValidateCommand());
  program.addCommand(createBuildCommand());
  program.addCommand(createDeployCommand());
  program.addCommand(createVerifyCommand());
  program.addCommand(createRegistryCommand());
  program.addCommand(createCfrCommand());
  program.addCommand(createDraftCommand());
  program.addCommand(createEnrichCommand());
  program.addCommand(createInitCommand());
  program.addCommand(createBundleInitCommand());

  return program;
}

export { generate, validate } from '../engine/pipeline.js';
export * from '../types.js';
export * from '../errors.js';