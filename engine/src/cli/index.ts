import { Command } from 'commander';
import { createGenerateCommand } from './generate.js';
import { createValidateCommand } from './validate-cmd.js';
import { createInitCommand } from './init.js';

export function createProgram() {
  const program = new Command();

  program
    .name('fixedcode')
    .description('Pluggable, spec-driven code generation engine')
    .version('0.1.0');

  program.addCommand(createGenerateCommand());
  program.addCommand(createValidateCommand());
  program.addCommand(createInitCommand());

  return program;
}

export { generate, validate } from '../engine/pipeline.js';
export * from '../types.js';
export * from '../errors.js';