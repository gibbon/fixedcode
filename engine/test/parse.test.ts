import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseSpec, validateEnvelope } from '../src/engine/parse.js';
import { SpecParseError, EnvelopeError } from '../src/errors.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'parse-test-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// parseSpec
// ---------------------------------------------------------------------------

describe('parseSpec', () => {
  it('parses a valid YAML spec and returns the expected shape', () => {
    const filePath = join(tmpDir, 'valid.yaml');
    writeFileSync(
      filePath,
      [
        'apiVersion: "1.0"',
        'kind: spring-domain',
        'metadata:',
        '  name: workspace-service',
        'spec:',
        '  someField: someValue',
      ].join('\n'),
    );

    const result = parseSpec(filePath);

    expect(result.apiVersion).toBe('1.0');
    expect(result.kind).toBe('spring-domain');
    expect(result.metadata.name).toBe('workspace-service');
    expect((result.spec as Record<string, unknown>).someField).toBe('someValue');
  });

  it('throws SpecParseError for a missing file', () => {
    const filePath = join(tmpDir, 'does-not-exist.yaml');

    expect(() => parseSpec(filePath)).toThrowError(SpecParseError);
  });

  it('throws SpecParseError for an empty file', () => {
    const filePath = join(tmpDir, 'empty.yaml');
    writeFileSync(filePath, '');

    expect(() => parseSpec(filePath)).toThrowError(SpecParseError);
  });

  it('throws SpecParseError for non-object YAML (bare string)', () => {
    const filePath = join(tmpDir, 'string-only.yaml');
    writeFileSync(filePath, 'just a string');

    expect(() => parseSpec(filePath)).toThrowError(SpecParseError);
  });
});

// ---------------------------------------------------------------------------
// validateEnvelope
// ---------------------------------------------------------------------------

describe('validateEnvelope', () => {
  it('passes for a valid envelope with all required fields present', () => {
    const spec = {
      apiVersion: '1.0',
      kind: 'spring-domain',
      metadata: { name: 'workspace-service' },
      spec: { someField: 'someValue' },
    };

    expect(() => validateEnvelope(spec)).not.toThrow();
  });

  it('throws EnvelopeError for missing apiVersion', () => {
    const spec = {
      kind: 'spring-domain',
      metadata: { name: 'workspace-service' },
      spec: {},
    } as any;

    expect(() => validateEnvelope(spec)).toThrowError(EnvelopeError);
  });

  it('throws EnvelopeError for missing kind', () => {
    const spec = {
      apiVersion: '1.0',
      metadata: { name: 'workspace-service' },
      spec: {},
    } as any;

    expect(() => validateEnvelope(spec)).toThrowError(EnvelopeError);
  });

  it('throws EnvelopeError for missing metadata.name', () => {
    const spec = {
      apiVersion: '1.0',
      kind: 'spring-domain',
      metadata: {} as any,
      spec: {},
    } as any;

    expect(() => validateEnvelope(spec)).toThrowError(EnvelopeError);
  });

  it('throws EnvelopeError for missing spec', () => {
    const spec = {
      apiVersion: '1.0',
      kind: 'spring-domain',
      metadata: { name: 'workspace-service' },
    } as any;

    expect(() => validateEnvelope(spec)).toThrowError(EnvelopeError);
  });

  it('collects ALL missing fields into a single error when given an empty object', () => {
    const spec = {} as any;

    let thrownError: EnvelopeError | undefined;
    try {
      validateEnvelope(spec);
    } catch (err) {
      if (err instanceof EnvelopeError) thrownError = err;
    }

    expect(thrownError).toBeInstanceOf(EnvelopeError);
    expect(thrownError!.message).toContain('apiVersion');
    expect(thrownError!.message).toContain('kind');
    expect(thrownError!.message).toContain('metadata.name');
    expect(thrownError!.message).toContain('spec');
  });
});
