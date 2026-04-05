/**
 * Static registry client.
 * Fetches a JSON index from a URL, supports search and install.
 * Designed to be reusable across fixedcode and r.dan.
 */
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const DEFAULT_REGISTRY_URL = 'https://raw.githubusercontent.com/fixedcode-ai/registry/main/registry.json';

export interface RegistryPackage {
  name: string;
  description: string;
  version: string;
  kind: 'bundle' | 'generator' | 'plugin' | 'agent-template';
  tags: string[];
  author: string;
  repo?: string;
  install: string;
}

export interface Registry {
  version: number;
  packages: RegistryPackage[];
}

export async function fetchRegistry(url?: string): Promise<Registry> {
  const registryUrl = url ?? DEFAULT_REGISTRY_URL;

  // Try fetching from URL first
  try {
    const response = await fetch(registryUrl, { headers: { 'Cache-Control': 'no-cache' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json() as Registry;
  } catch {
    // Fall back to local registry if URL fails
    const localPath = resolve(process.cwd(), 'registry.json');
    if (existsSync(localPath)) {
      return JSON.parse(readFileSync(localPath, 'utf-8'));
    }
    throw new Error(`Cannot fetch registry from ${registryUrl} and no local registry.json found`);
  }
}

export function searchRegistry(registry: Registry, query: string): RegistryPackage[] {
  const q = query.toLowerCase();
  return registry.packages.filter(pkg =>
    pkg.name.toLowerCase().includes(q) ||
    pkg.description.toLowerCase().includes(q) ||
    pkg.tags.some(t => t.toLowerCase().includes(q)) ||
    pkg.kind.toLowerCase().includes(q)
  );
}

export function listRegistry(registry: Registry, kind?: string): RegistryPackage[] {
  if (!kind) return registry.packages;
  return registry.packages.filter(pkg => pkg.kind === kind);
}

export interface InstallResult {
  package: string;
  configUpdated: boolean;
}

/**
 * Install a package from the registry:
 * 1. Run npm install
 * 2. Add to .fixedcode.yaml (or equivalent config)
 */
export function installPackage(
  pkg: RegistryPackage,
  projectDir: string,
  configFile = '.fixedcode.yaml',
  configSection = 'bundles'
): InstallResult {
  // Run npm install
  console.log(`Installing ${pkg.name}...`);
  execSync(pkg.install, { cwd: projectDir, stdio: 'inherit' });

  // Update config file
  const configPath = resolve(projectDir, configFile);
  let config: Record<string, any> = {};
  if (existsSync(configPath)) {
    config = parseYaml(readFileSync(configPath, 'utf-8')) ?? {};
  }

  // Determine config section based on package kind
  const section = pkg.kind === 'generator' ? 'generators' : configSection;
  if (!config[section]) config[section] = {};

  // Extract short name from scoped package (e.g. @fixedcode/bundle-spring-domain → spring-domain)
  const shortName = pkg.name.replace(/^@[\w-]+\/(bundle-|generator-)/, '');
  config[section][shortName] = pkg.name;

  writeFileSync(configPath, stringifyYaml(config), 'utf-8');
  console.log(`Added ${shortName} to ${configFile} under ${section}`);

  return { package: pkg.name, configUpdated: true };
}
