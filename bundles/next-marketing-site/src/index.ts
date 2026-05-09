import type { Bundle, Context, FileEntry } from 'fixedcode';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { enrich, type NextMarketingSiteContext } from './enrich/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(join(__dirname, '..', 'schema.json'), 'utf-8'));

export { enrich };
export type {
  NextMarketingSiteContext,
  EnrichedNavLink,
  EnrichedPage,
  EnrichedBrand,
  EnrichedHero,
  EnrichedSocialLinks,
} from './enrich/index.js';

export function generateFiles(ctx: NextMarketingSiteContext): FileEntry[] {
  const c = ctx as unknown as Record<string, unknown>;
  const files: FileEntry[] = [
    { template: 'package.json.hbs', output: 'package.json', ctx: c },
    { template: 'next.config.mjs.hbs', output: 'next.config.mjs', ctx: c },
    { template: 'tsconfig.json.hbs', output: 'tsconfig.json', ctx: c },
    { template: 'next-env.d.ts.hbs', output: 'next-env.d.ts', ctx: c },
    { template: 'tailwind.config.ts.hbs', output: 'tailwind.config.ts', ctx: c },
    { template: 'postcss.config.mjs.hbs', output: 'postcss.config.mjs', ctx: c },
    { template: '.gitignore.hbs', output: '.gitignore', ctx: c },
    { template: 'README.md.hbs', output: 'README.md', ctx: c },
    { template: 'app/layout.tsx.hbs', output: 'app/layout.tsx', ctx: c },
    { template: 'app/globals.css.hbs', output: 'app/globals.css', ctx: c },
    // Landing page is an extension point — owners customise the section composition.
    { template: 'app/page.tsx.hbs', output: 'app/page.tsx', ctx: c, overwrite: false },
    { template: 'components/Navbar.tsx.hbs', output: 'components/Navbar.tsx', ctx: c },
    { template: 'components/Hero.tsx.hbs', output: 'components/Hero.tsx', ctx: c },
    { template: 'components/Footer.tsx.hbs', output: 'components/Footer.tsx', ctx: c },
  ];

  // One extension-point file per additional page in the spec.
  for (const page of ctx.pages) {
    files.push({
      template: 'app/page-template.tsx.hbs',
      output: `app/${page.slug}/page.tsx`,
      ctx: { ...c, page },
      overwrite: false,
    });
  }

  if (ctx.hasAnalytics) {
    files.push({ template: '.env.example.hbs', output: '.env.example', ctx: c });
  }

  if (ctx.hasDocker) {
    files.push(
      { template: 'Dockerfile.hbs', output: 'Dockerfile', ctx: c },
      { template: 'nginx.conf.hbs', output: 'nginx.conf', ctx: c },
    );
  }

  return files;
}

export const helpers = {
  eq: (a: unknown, b: unknown) => a === b,
  json: (v: unknown) => JSON.stringify(v),
};

export const bundle: Bundle = {
  kind: 'next-marketing-site',
  specSchema: schema,
  enrich: enrich as unknown as Bundle['enrich'],
  generateFiles: generateFiles as unknown as (ctx: Context) => FileEntry[],
  templates: 'templates',
  helpers: helpers as unknown as Bundle['helpers'],
  cfrs: {
    provides: ['docker'],
    files: {
      docker: ['Dockerfile', 'nginx.conf'],
    },
  },
};

export default bundle;
