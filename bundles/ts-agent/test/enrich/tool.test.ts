import { describe, it, expect } from 'vitest';
import { enrichTool } from '../../src/enrich/tool.js';

describe('enrichTool', () => {
  it('enriches an HTTP tool with naming variants', () => {
    const tool = enrichTool({ name: 'call-api', type: 'http', config: { baseUrl: 'https://api.example.com' } });
    expect(tool.name.pascal).toBe('CallApi');
    expect(tool.name.camel).toBe('callApi');
    expect(tool.name.kebab).toBe('call-api');
    expect(tool.type).toBe('http');
    expect(tool.templatePath).toBe('tools/http.ts.hbs');
  });

  it('enriches a CLI tool', () => {
    const tool = enrichTool({ name: 'run-script', type: 'cli', config: { command: 'kubectl' } });
    expect(tool.name.pascal).toBe('RunScript');
    expect(tool.type).toBe('cli');
    expect(tool.templatePath).toBe('tools/cli.ts.hbs');
    expect(tool.config.command).toBe('kubectl');
  });

  it('enriches a function tool', () => {
    const tool = enrichTool({ name: 'write-file', type: 'function', config: { handler: 'write-file' } });
    expect(tool.type).toBe('function');
    expect(tool.templatePath).toBe('tools/function.ts.hbs');
  });

  it('enriches a database tool', () => {
    const tool = enrichTool({ name: 'query-db', type: 'database', config: { readOnly: true } });
    expect(tool.type).toBe('database');
    expect(tool.templatePath).toBe('tools/database.ts.hbs');
  });

  it('enriches an MCP tool', () => {
    const tool = enrichTool({ name: 'external', type: 'mcp', config: { server: 'localhost:3001' } });
    expect(tool.type).toBe('mcp');
    expect(tool.templatePath).toBe('tools/mcp.ts.hbs');
  });

  it('defaults config to empty object', () => {
    const tool = enrichTool({ name: 'simple', type: 'cli' });
    expect(tool.config).toEqual({});
  });
});
