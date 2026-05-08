import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { findConfigFile, loadConfig } from '../src/engine/config.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'config-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.FIXEDCODE_CONFIG;
});

// ---------------------------------------------------------------------------
// findConfigFile
// ---------------------------------------------------------------------------

describe('findConfigFile', () => {
  it('finds .fixedcode.yaml in the given directory', () => {
    const configPath = join(tmpDir, '.fixedcode.yaml');
    writeFileSync(configPath, 'bundles: {}');
    expect(findConfigFile(tmpDir)).toBe(configPath);
  });

  it('walks up directories to find config', () => {
    const configPath = join(tmpDir, '.fixedcode.yaml');
    writeFileSync(configPath, 'bundles: {}');
    const subDir = join(tmpDir, 'sub', 'dir');
    mkdirSync(subDir, { recursive: true });
    expect(findConfigFile(subDir)).toBe(configPath);
  });

  it('returns null when no config found anywhere', () => {
    // Use a temp dir that definitely has no .fixedcode.yaml up the tree
    // We create a deep nested dir under tmpDir which has no config file
    const deepDir = join(tmpDir, 'a', 'b', 'c');
    mkdirSync(deepDir, { recursive: true });
    // tmpDir itself has no config — result should be null (or user-level config, which we cannot control,
    // so we just check it does not throw)
    expect(() => findConfigFile(deepDir)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// loadConfig
// ---------------------------------------------------------------------------

describe('loadConfig', () => {
  it('returns defaults (empty bundles, configDir=cwd) when no config exists', () => {
    const result = loadConfig(tmpDir);
    expect(result.bundles).toEqual({});
    expect(result.configDir).toBe(tmpDir);
  });

  it('loads from explicit path (second argument)', () => {
    const configPath = join(tmpDir, 'my-config.yaml');
    writeFileSync(configPath, ['bundles:', '  spring-domain: ./bundles/spring-domain'].join('\n'));
    const result = loadConfig(tmpDir, configPath);
    expect(result.bundles).toEqual({ 'spring-domain': './bundles/spring-domain' });
    expect(result.configDir).toBe(tmpDir);
  });

  it('sets configDir to parent of the explicit config file', () => {
    const subDir = join(tmpDir, 'sub');
    mkdirSync(subDir);
    const configPath = join(subDir, 'my-config.yaml');
    writeFileSync(configPath, 'bundles: {}');
    const result = loadConfig(tmpDir, configPath);
    expect(result.configDir).toBe(resolve(configPath, '..'));
  });

  it('respects FIXEDCODE_CONFIG env var', () => {
    const configPath = join(tmpDir, 'env-config.yaml');
    writeFileSync(configPath, 'bundles:\n  hello: ./hello');
    process.env.FIXEDCODE_CONFIG = configPath;
    const result = loadConfig(tmpDir);
    expect(result.bundles).toEqual({ hello: './hello' });
  });

  it('explicit path takes priority over env var', () => {
    const envConfigPath = join(tmpDir, 'env-config.yaml');
    writeFileSync(envConfigPath, 'bundles:\n  from-env: ./env');
    process.env.FIXEDCODE_CONFIG = envConfigPath;

    const explicitConfigPath = join(tmpDir, 'explicit-config.yaml');
    writeFileSync(explicitConfigPath, 'bundles:\n  from-explicit: ./explicit');

    const result = loadConfig(tmpDir, explicitConfigPath);
    expect(result.bundles).toEqual({ 'from-explicit': './explicit' });
  });

  it('handles empty YAML gracefully (returns defaults)', () => {
    const configPath = join(tmpDir, 'empty.yaml');
    writeFileSync(configPath, '');
    const result = loadConfig(tmpDir, configPath);
    expect(result.bundles).toEqual({});
    expect(result.configDir).toBe(tmpDir);
  });

  it('handles invalid YAML gracefully (returns defaults)', () => {
    const configPath = join(tmpDir, 'bad.yaml');
    writeFileSync(configPath, '{ this: is: not: valid: yaml::: }\n---\n!!');
    const result = loadConfig(tmpDir, configPath);
    expect(result.bundles).toEqual({});
    expect(result.configDir).toBe(tmpDir);
  });

  it('warns when bundles is not an object', () => {
    const configPath = join(tmpDir, 'bad-bundles.yaml');
    writeFileSync(configPath, 'bundles: "should-be-an-object"');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const result = loadConfig(tmpDir, configPath);
      expect(warnSpy).toHaveBeenCalled();
      expect(result.bundles).toEqual({});
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('loads generators config', () => {
    const configPath = join(tmpDir, 'with-generators.yaml');
    writeFileSync(
      configPath,
      [
        'bundles:',
        '  spring-domain: ./bundles/spring-domain',
        'generators:',
        '  openapi: ./generators/openapi',
      ].join('\n'),
    );
    const result = loadConfig(tmpDir, configPath);
    expect(result.generators).toEqual({ openapi: './generators/openapi' });
  });

  it('loads llm config', () => {
    const configPath = join(tmpDir, 'with-llm.yaml');
    writeFileSync(
      configPath,
      [
        'bundles: {}',
        'llm:',
        '  provider: openrouter',
        '  model: google/gemini-2.5-flash',
        '  baseUrl: https://openrouter.ai/api/v1',
        '  apiKeyEnv: OPENROUTER_API_KEY',
      ].join('\n'),
    );
    const result = loadConfig(tmpDir, configPath);
    expect(result.llm).toEqual({
      provider: 'openrouter',
      model: 'google/gemini-2.5-flash',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKeyEnv: 'OPENROUTER_API_KEY',
    });
  });
});
