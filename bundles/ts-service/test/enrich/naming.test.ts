import { describe, it, expect } from 'vitest';
import { generateVariants } from '../../src/enrich/naming.js';

describe('generateVariants', () => {
  it('generates all naming variants from kebab-case input', () => {
    const v = generateVariants('ops-agent');
    expect(v.pascal).toBe('OpsAgent');
    expect(v.camel).toBe('opsAgent');
    expect(v.snake).toBe('ops_agent');
    expect(v.kebab).toBe('ops-agent');
  });

  it('generates variants from PascalCase input', () => {
    const v = generateVariants('OpsAgent');
    expect(v.kebab).toBe('ops-agent');
    expect(v.snake).toBe('ops_agent');
  });
});
