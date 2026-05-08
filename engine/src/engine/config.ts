import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { parse as parseYaml } from 'yaml';
import { resolve, parse } from 'node:path';
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

  const userConfig = resolve(homedir(), '.config/fixedcode/config.yaml');
  if (existsSync(userConfig)) {
    return userConfig;
  }

  return null;
}

export function loadConfig(cwd: string = process.cwd(), explicitPath?: string): FixedCodeConfig {
  // Explicit path takes priority, then FIXEDCODE_CONFIG env var, then search
  const configPath =
    explicitPath ??
    (process.env.FIXEDCODE_CONFIG && existsSync(process.env.FIXEDCODE_CONFIG)
      ? process.env.FIXEDCODE_CONFIG
      : null) ??
    findConfigFile(cwd);

  if (!configPath) {
    return { bundles: {}, configDir: cwd };
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const parsed = parseYaml(content);
    if (!parsed || typeof parsed !== 'object') {
      console.warn(`Warning: ${configPath} is empty or not a valid YAML object, using defaults`);
      return { bundles: {}, configDir: cwd };
    }
    const cfg = parsed as Record<string, unknown>;
    const configDir = resolve(configPath, '..');

    if (cfg.bundles && typeof cfg.bundles !== 'object') {
      console.warn(`Warning: 'bundles' in ${configPath} must be an object, ignoring`);
    }
    if (cfg.generators && typeof cfg.generators !== 'object') {
      console.warn(`Warning: 'generators' in ${configPath} must be an object, ignoring`);
    }

    return {
      bundles: (typeof cfg.bundles === 'object' && cfg.bundles !== null
        ? cfg.bundles
        : {}) as Record<string, string>,
      generators: (typeof cfg.generators === 'object' && cfg.generators !== null
        ? cfg.generators
        : {}) as Record<string, string>,
      configDir,
      llm: cfg.llm as FixedCodeConfig['llm'],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    console.warn(`Warning: Failed to load config from ${configPath}: ${msg}`);
    return { bundles: {}, configDir: cwd };
  }
}
