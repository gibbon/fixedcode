import { describe, it, expect } from 'vitest';
import { enrich, generateFiles } from '../src/index.js';

const meta = { name: 'demo', apiVersion: '1.0' };

const baseSpec = () => ({
  appName: 'demo-site',
  brand: { name: 'Demo', tagline: 'Demo tagline.' },
});

describe('next-marketing-site generateFiles', () => {
  it('produces the base file set with one extension-point landing page when no extra pages', () => {
    const ctx = enrich(baseSpec(), meta);
    const files = generateFiles(ctx);
    const outputs = files.map((f) => f.output);

    expect(outputs).toContain('package.json');
    expect(outputs).toContain('next.config.mjs');
    expect(outputs).toContain('tsconfig.json');
    expect(outputs).toContain('tailwind.config.ts');
    expect(outputs).toContain('postcss.config.mjs');
    expect(outputs).toContain('app/layout.tsx');
    expect(outputs).toContain('app/globals.css');
    expect(outputs).toContain('app/page.tsx');
    expect(outputs).toContain('components/Navbar.tsx');
    expect(outputs).toContain('components/Hero.tsx');
    expect(outputs).toContain('components/Footer.tsx');

    // landing page is an extension point
    const landing = files.find((f) => f.output === 'app/page.tsx');
    expect(landing?.overwrite).toBe(false);

    // no docker by default
    expect(outputs).not.toContain('Dockerfile');
    expect(outputs).not.toContain('nginx.conf');
    // no env.example unless analytics requires it
    expect(outputs).not.toContain('.env.example');
  });

  it('expands one extension-point file per page in spec.pages', () => {
    const ctx = enrich(
      {
        ...baseSpec(),
        pages: [
          { slug: 'about', title: 'About' },
          { slug: 'contact', title: 'Contact' },
          { slug: 'pricing', title: 'Pricing' },
        ],
      },
      meta,
    );
    const files = generateFiles(ctx);
    const pageFiles = files.filter(
      (f) => f.output.startsWith('app/') && f.output.endsWith('/page.tsx'),
    );
    // landing page + 3 spec pages
    expect(pageFiles.map((f) => f.output)).toEqual(
      expect.arrayContaining([
        'app/page.tsx',
        'app/about/page.tsx',
        'app/contact/page.tsx',
        'app/pricing/page.tsx',
      ]),
    );
    expect(pageFiles).toHaveLength(4);

    for (const file of pageFiles) {
      expect(file.overwrite).toBe(false);
    }
  });

  it('omits Dockerfile when features.docker is false', () => {
    const ctx = enrich({ ...baseSpec(), features: { docker: false } }, meta);
    const outputs = generateFiles(ctx).map((f) => f.output);
    expect(outputs).not.toContain('Dockerfile');
    expect(outputs).not.toContain('nginx.conf');
  });

  it('emits Dockerfile + nginx.conf + .env.example when docker and analytics on', () => {
    const ctx = enrich(
      {
        ...baseSpec(),
        features: {
          docker: true,
          analytics: 'umami',
          analyticsDomain: 'demo.com',
          analyticsScriptUrl: 'https://us.umami.example/script.js',
        },
      },
      meta,
    );
    const outputs = generateFiles(ctx).map((f) => f.output);
    expect(outputs).toContain('Dockerfile');
    expect(outputs).toContain('nginx.conf');
    expect(outputs).toContain('.env.example');
  });
});
