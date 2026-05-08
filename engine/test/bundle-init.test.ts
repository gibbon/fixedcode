import { describe, expect, it } from 'vitest';
import { validateBundleName } from '../src/cli/bundle-init.js';

describe('validateBundleName', () => {
  it('accepts a simple kebab-case name', () => {
    expect(() => validateBundleName('my-bundle')).not.toThrow();
  });

  it('accepts names with digits', () => {
    expect(() => validateBundleName('bundle-v2')).not.toThrow();
  });

  it('rejects path-traversal: leading double-dot segment', () => {
    expect(() => validateBundleName('../evil')).toThrow(/invalid bundle name/i);
  });

  it('rejects path-traversal: embedded double-dot segment', () => {
    expect(() => validateBundleName('foo/../etc/evil')).toThrow(/invalid bundle name/i);
  });

  it('rejects backslash separators (Windows-style traversal)', () => {
    expect(() => validateBundleName('..\\\\foo')).toThrow(/invalid bundle name/i);
  });

  it('rejects leading slash (absolute paths)', () => {
    expect(() => validateBundleName('/etc/evil')).toThrow(/invalid bundle name/i);
  });

  it('rejects names with forward slashes', () => {
    expect(() => validateBundleName('a/b')).toThrow(/invalid bundle name/i);
  });

  it('rejects empty name', () => {
    expect(() => validateBundleName('')).toThrow(/invalid bundle name/i);
  });

  it('rejects names starting with a dot', () => {
    expect(() => validateBundleName('.hidden')).toThrow(/invalid bundle name/i);
  });

  it('rejects null bytes', () => {
    expect(() => validateBundleName('foo\\u0000bar')).toThrow(/invalid bundle name/i);
  });
});
