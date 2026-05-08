/**
 * Static registry client.
 * Fetches a JSON index from a URL, supports search and install.
 * Designed to be reusable across fixedcode and r.dan.
 */
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const DEFAULT_REGISTRY_URL = 'https://raw.githubusercontent.com/fixedcode-ai/registry/main/registry.json';
const DEFAULT_REGISTRY_REPO = 'fixedcode-ai/registry';

const REGISTRY_REPO_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function validateRegistryRepo(repo: string): string {
  if (typeof repo !== 'string' || repo.length === 0) {
    throw new Error('Invalid registry repo: empty');
  }
  if (!REGISTRY_REPO_PATTERN.test(repo)) {
    throw new Error(
      `Invalid registry repo: ${JSON.stringify(repo)} — must match owner/repo (alphanumerics, dots, dashes, underscores)`,
    );
  }
  return repo;
}

const INSTALL_PACKAGE_PATTERN =
  /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*(?:@[a-z0-9][a-z0-9._-]*)?$/i;

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
  // Validate install command against allowlist before executing.
  // Strict shape: `npm install <single-package>` where <single-package> is a
  // semver-style npm package identifier (optional @scope/, no relative paths).
  const installParts = pkg.install.split(/\s+/);
  if (
    installParts.length !== 3 ||
    installParts[0] !== 'npm' ||
    installParts[1] !== 'install' ||
    !INSTALL_PACKAGE_PATTERN.test(installParts[2]) ||
    installParts[2].includes('..')
  ) {
    throw new Error(`Unsafe install command: ${pkg.install}`);
  }

  // Run npm install
  console.log(`Installing ${pkg.name}...`);
  execFileSync(installParts[0], installParts.slice(1), { cwd: projectDir, stdio: 'inherit' });

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

export interface PublishOptions {
  /** Directory containing the bundle/generator package.json */
  packageDir: string;
  /** Package kind */
  kind: RegistryPackage['kind'];
  /** Tags for discoverability */
  tags: string[];
  /** GitHub repo URL for the package (if hosted on GitHub) */
  repo?: string;
  /** Registry repo to open PR against (default: fixedcode-ai/registry) */
  registryRepo?: string;
}

/**
 * Build a registry entry from a package.json and open a PR to the registry repo.
 * Requires `gh` CLI to be installed and authenticated.
 */
export async function publishPackage(options: PublishOptions): Promise<string> {
  const pkgJsonPath = resolve(options.packageDir, 'package.json');
  if (!existsSync(pkgJsonPath)) {
    throw new Error(`No package.json found in ${options.packageDir}`);
  }

  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
  const name = pkgJson.name as string;
  const version = pkgJson.version as string;
  const description = pkgJson.description as string ?? '';

  if (!name) throw new Error('package.json must have a "name" field');
  if (!version) throw new Error('package.json must have a "version" field');

  // Detect repo from package.json or git remote
  let repo = options.repo;
  if (!repo) {
    try {
      repo = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: options.packageDir, encoding: 'utf-8' }).trim();
      // Convert SSH to HTTPS
      repo = repo.replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, '');
    } catch {
      // No git remote — that's ok
    }
  }

  // Determine install command
  const install = repo
    ? `npm install ${repo.replace('https://github.com/', 'github:')}`
    : `npm install ${name}`;

  // Detect author from git or package.json
  const author = pkgJson.author ?? (() => {
    try { return execFileSync('git', ['config', 'user.name'], { encoding: 'utf-8' }).trim(); } catch { return 'unknown'; }
  })();

  const entry: RegistryPackage = {
    name,
    description: description || `${name} — a fixedcode ${options.kind}`,
    version,
    kind: options.kind,
    tags: options.tags,
    author: typeof author === 'string' ? author : author.name ?? 'unknown',
    repo,
    install,
  };

  const registryRepo = validateRegistryRepo(options.registryRepo ?? DEFAULT_REGISTRY_REPO);

  // Fetch current registry
  const registry = await fetchRegistry();

  // Check for existing entry and update or append
  const existingIdx = registry.packages.findIndex(p => p.name === name);
  if (existingIdx >= 0) {
    registry.packages[existingIdx] = entry;
  } else {
    registry.packages.push(entry);
  }

  const registryJson = JSON.stringify(registry, null, 2) + '\n';

  // Create a temporary branch, commit, and open PR via gh CLI
  const branchName = `add-${name.replace(/[@/]/g, '-').replace(/^-/, '')}`;
  const tmpDir = resolve(options.packageDir, '.registry-pr-tmp');

  try {
    execFileSync('gh', ['repo', 'clone', registryRepo, tmpDir, '--', '--depth', '1'], { stdio: 'pipe' });
    writeFileSync(resolve(tmpDir, 'registry.json'), registryJson, 'utf-8');
    execFileSync('git', ['checkout', '-b', branchName], { cwd: tmpDir, stdio: 'pipe' });
    execFileSync('git', ['add', 'registry.json'], { cwd: tmpDir, stdio: 'pipe' });

    const commitMsg = existingIdx >= 0
      ? `Update ${name} to ${version}`
      : `Add ${name}@${version}`;
    execFileSync('git', ['commit', '-m', commitMsg], { cwd: tmpDir, stdio: 'pipe' });
    execFileSync('git', ['push', 'origin', branchName], { cwd: tmpDir, stdio: 'pipe' });

    const prBody = [
      `## Add package to registry`,
      '',
      `- **Name:** ${name}`,
      `- **Version:** ${version}`,
      `- **Kind:** ${options.kind}`,
      `- **Tags:** ${options.tags.join(', ')}`,
      repo ? `- **Repo:** ${repo}` : '',
      '',
      `Generated by \`fixedcode registry publish\``,
    ].filter(Boolean).join('\n');

    let prUrl: string;
    try {
      prUrl = execFileSync(
        'gh',
        ['pr', 'create', '--repo', registryRepo, '--head', branchName, '--title', commitMsg, '--body', prBody],
        { cwd: tmpDir, encoding: 'utf-8' }
      ).trim();
    } catch (prErr) {
      // PR creation failed but branch was already pushed — clean up remote branch
      try {
        execFileSync('git', ['push', 'origin', '--delete', branchName], { cwd: tmpDir, stdio: 'pipe' });
      } catch { /* best effort cleanup */ }
      throw prErr;
    }

    return prUrl;
  } finally {
    // Clean up temp directory
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}
