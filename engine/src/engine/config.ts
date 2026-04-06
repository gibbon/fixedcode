import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { resolve, parse } from 'node:path';
import { existsSync } from 'node:fs';
import type { FixedCodeConfig } from '../types.js';

const DEFAULT_CONFIG_NAME = '.fixedcode.yaml';

export function findConfigFile(cwd: string): string | null {
  let current = resolve(cwd);
  const root = parse(resolve(cwd)).root;
  
  while (current !== root) {
    const configPath = resolve(current, DEFAULT_CONFIG_NAME);
    if (existsSync(configPath)) {
      return configPath;
    }
    current = resolve(current, '..');
  }
  
  const projectConfig = resolve(cwd, DEFAULT_CONFIG_NAME);
  if (existsSync(projectConfig)) {
    return projectConfig;
  }

  const userConfig = resolve(process.env.HOME ?? '', '.config/fixedcode/config.yaml');
  if (existsSync(userConfig)) {
    return userConfig;
  }

  return null;
}

export function loadConfig(cwd: string = process.cwd(), explicitPath?: string): FixedCodeConfig {
  // Explicit path takes priority, then FIXEDCODE_CONFIG env var, then search
  const configPath = explicitPath
    ?? (process.env.FIXEDCODE_CONFIG && existsSync(process.env.FIXEDCODE_CONFIG) ? process.env.FIXEDCODE_CONFIG : null)
    ?? findConfigFile(cwd);

  if (!configPath) {
    return { bundles: {}, configDir: cwd };
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const parsed = parseYaml(content) as { bundles?: Record<string, string>; generators?: Record<string, string>; llm?: { provider?: string; model?: string; baseUrl?: string; apiKeyEnv?: string; } };
    const configDir = resolve(configPath, '..');

    return {
      bundles: parsed.bundles ?? {},
      generators: parsed.generators ?? {},
      configDir,
      llm: parsed.llm as FixedCodeConfig['llm'],
    };
  } catch (err) {
    console.error(`Warning: Failed to load config from ${configPath}:`, err);
    return { bundles: {}, configDir: cwd };
  }
}