import { describe, it, expect } from 'vitest';
import { renderTemplates } from '@fixedcode/engine';
import bundle from '../src/index.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesDir = join(__dirname, '..', 'templates');

describe('spring-library template rendering', () => {
  it('renders all templates without errors', async () => {
    const ctx = bundle.enrich(
      {
        library: { name: 'gap-workspace-core', description: 'Workspace domain library' },
        features: {
          database: { enabled: true, type: 'postgresql', port: 5433 },
          messaging: { enabled: true },
        },
        service: { port: 8081 },
      },
      { name: 'workspace', apiVersion: '1.0' },
    );

    const rendered = await renderTemplates(templatesDir, ctx, {
      noEscape: true,
      helpers: bundle.helpers,
      partials: bundle.partials,
    });

    // Should produce many files
    expect(rendered.length).toBeGreaterThan(30);
    console.log(`Rendered ${rendered.length} files`);

    // Check key files exist
    const paths = rendered.map((r) => r.path);
    expect(paths.some((p) => p.includes('build.gradle.kts'))).toBe(true);
    expect(paths.some((p) => p.includes('docker-compose.yml'))).toBe(true);
    expect(paths.some((p) => p.includes('application.yml'))).toBe(true);
    // Library bundles produce autoconfiguration imports instead of Application.kt
    expect(paths.some((p) => p.includes('AutoConfiguration.imports') || p.includes('.kt'))).toBe(
      true,
    );

    // Check no rendered content contains unresolved Handlebars
    for (const file of rendered) {
      // Allow {{...}} in files that legitimately contain Handlebars/mustache syntax
      if (file.path.includes('.hbs') || file.path.includes('.tmpl')) continue;
      // Check for obviously broken output
      expect(file.content).not.toContain('{{LibraryName}}');
      expect(file.content).not.toContain('{{PackageName}}');
    }
  });

  it('key files have correct package declarations', async () => {
    const ctx = bundle.enrich(
      {
        library: { name: 'gap-workspace-core', description: 'Workspace domain library' },
        service: { port: 8081 },
      },
      { name: 'workspace', apiVersion: '1.0' },
    );

    const rendered = await renderTemplates(templatesDir, ctx, {
      noEscape: true,
      helpers: bundle.helpers,
    });

    // settings.gradle.kts should reference the library name
    const settingsFile = rendered.find((r) => r.path.includes('settings.gradle.kts'));
    if (settingsFile) {
      expect(settingsFile.content).toContain('gap-workspace-core');
    }

    // Kotlin files under the domain package path should use the enriched package
    const domainKotlinFiles = rendered.filter(
      (r) => r.path.endsWith('.kt') && r.path.includes('workspace'),
    );
    for (const file of domainKotlinFiles) {
      expect(file.content).toContain('com.example.workspace');
    }
  });
});
