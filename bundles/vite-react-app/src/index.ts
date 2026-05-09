import type { Bundle, Context, FileEntry, SpecMetadata } from 'fixedcode';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { enrich, type ViteReactAppContext } from './enrich/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(join(__dirname, '..', 'schema.json'), 'utf-8'));

export { enrich };
export type { ViteReactAppContext } from './enrich/index.js';

export function generateFiles(ctx: ViteReactAppContext): FileEntry[] {
  const c = ctx as unknown as Record<string, unknown>;
  const files: FileEntry[] = [
    { template: 'package.json.hbs', output: 'package.json', ctx: c },
    { template: 'vite.config.ts.hbs', output: 'vite.config.ts', ctx: c },
    { template: 'tsconfig.json.hbs', output: 'tsconfig.json', ctx: c },
    { template: 'tsconfig.app.json.hbs', output: 'tsconfig.app.json', ctx: c },
    { template: 'tsconfig.node.json.hbs', output: 'tsconfig.node.json', ctx: c },
    { template: 'eslint.config.js.hbs', output: 'eslint.config.js', ctx: c },
    { template: 'index.html.hbs', output: 'index.html', ctx: c },
    { template: '.gitignore.hbs', output: '.gitignore', ctx: c },
    { template: '.env.example.hbs', output: '.env.example', ctx: c },
    { template: 'README.md.hbs', output: 'README.md', ctx: c },
    { template: 'src/main.tsx.hbs', output: 'src/main.tsx', ctx: c },
    { template: 'src/App.tsx.hbs', output: 'src/App.tsx', ctx: c },
    { template: 'src/index.css.hbs', output: 'src/index.css', ctx: c },
    { template: 'src/vite-env.d.ts.hbs', output: 'src/vite-env.d.ts', ctx: c },
  ];

  if (ctx.hasTanstackRouter) {
    files.push({ template: 'src/router.tsx.hbs', output: 'src/router.tsx', ctx: c });
  }

  // One extension-point file per route
  for (const route of ctx.routes) {
    files.push({
      template: 'src/routes/route.tsx.hbs',
      output: `src/routes/${route.routeFile}.tsx`,
      ctx: { ...c, route },
      overwrite: false,
    });
  }

  if (ctx.hasApi) {
    files.push({ template: 'src/lib/api.ts.hbs', output: 'src/lib/api.ts', ctx: c });
  }

  if (ctx.hasSupabase) {
    files.push({ template: 'src/lib/supabase.ts.hbs', output: 'src/lib/supabase.ts', ctx: c });
  }

  if (ctx.hasDocker) {
    files.push(
      { template: 'Dockerfile.hbs', output: 'Dockerfile', ctx: c },
      { template: 'nginx.conf.hbs', output: 'nginx.conf', ctx: c },
    );
  }

  // Recipe: image-upload
  if (ctx.recipeImageUpload) {
    files.push(
      {
        template: 'recipes/image-upload/src/types/image.ts.hbs',
        output: 'src/types/image.ts',
        ctx: c,
      },
      {
        template: 'recipes/image-upload/src/lib/images.ts.hbs',
        output: 'src/lib/images.ts',
        ctx: c,
      },
      {
        template: 'recipes/image-upload/src/components/ImageUpload.tsx.hbs',
        output: 'src/components/ImageUpload.tsx',
        ctx: c,
        overwrite: false,
      },
      {
        template: 'recipes/image-upload/src/components/ImageGallery.tsx.hbs',
        output: 'src/components/ImageGallery.tsx',
        ctx: c,
      },
    );
  }

  return files;
}

export const bundle: Bundle = {
  kind: 'vite-react-app',
  specSchema: schema,
  enrich: enrich as unknown as Bundle['enrich'],
  generateFiles: generateFiles as unknown as (ctx: Context) => FileEntry[],
  templates: 'templates',
  cfrs: {
    provides: ['docker'],
    files: {
      docker: ['Dockerfile', 'nginx.conf'],
    },
  },
};

export default bundle;
