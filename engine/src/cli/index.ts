import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { createGenerateCommand } from './generate.js';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const pkgVersion = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8')).version as string;
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
    .version(pkgVersion);

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
export { build } from '../engine/build.js';
export { deploy } from '../engine/deploy.js';
export { verify } from '../engine/verify.js';
export { fetchRegistry, searchRegistry, installPackage, publishPackage } from '../engine/registry.js';
export { draft } from '../engine/draft.js';
export { enrich } from '../engine/enrich.js';
export { resolveLlmConfig, chatCompletion } from '../engine/llm.js';
export * from '../types.js';
export * from '../errors.js';