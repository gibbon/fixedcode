import { Command } from 'commander';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const enginePkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'));

export function createBundleInitCommand() {
  return new Command('bundle')
    .description('Bundle management commands')
    .addCommand(new Command('init')
      .description('Scaffold a new bundle project')
      .argument('<name>', 'Bundle name (e.g., my-bundle)')
      .option('-k, --kind <kind>', 'Bundle kind (e.g., my-domain)', 'my-domain')
      .option('-o, --output <dir>', 'Output directory', './bundles')
      .action(async (name: string, opts) => {
        const outputDir = join(opts.output, name);
        
        if (existsSync(outputDir)) {
          console.error(`Error: Directory ${outputDir} already exists`);
          process.exit(1);
        }
        
        mkdirSync(outputDir, { recursive: true });
        mkdirSync(join(outputDir, 'src/enrich'), { recursive: true });
        mkdirSync(join(outputDir, 'templates'), { recursive: true });
        mkdirSync(join(outputDir, 'test/enrich'), { recursive: true });
        mkdirSync(join(outputDir, 'test/fixtures'), { recursive: true });
        
        const pkgJson = {
          name: `@fixedcode/bundle-${name}`,
          version: enginePkg.version,
          type: 'module',
          main: 'dist/index.js',
          types: 'dist/index.d.ts',
          scripts: {
            build: 'tsc',
            test: 'vitest run',
          },
          dependencies: {
            '@fixedcode/engine': 'file:../../engine',
          },
          devDependencies: {
            '@types/node': '^22.0.0',
            handlebars: '^4.7.0',
            typescript: '^5.7.0',
            vitest: '^3.0.0',
          },
        };
        
        const tsConfig = {
          compilerOptions: {
            target: 'ES2022',
            module: 'Node16',
            moduleResolution: 'Node16',
            outDir: 'dist',
            rootDir: 'src',
            strict: true,
            declaration: true,
            esModuleInterop: true,
            resolveJsonModule: true,
            skipLibCheck: true,
          },
          include: ['src'],
          exclude: ['node_modules', 'dist', 'test'],
        };
        
        const bundleCode = `import type { Bundle, SpecMetadata } from '@fixedcode/engine';
import type { Context } from '@fixedcode/engine';
import { enrich } from './enrich/index.js';

const schema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' },
  },
};

export const bundle: Bundle = {
  kind: '${opts.kind}',
  specSchema: schema as Bundle['specSchema'],
  enrich: enrich as unknown as (spec: Record<string, unknown>, metadata: SpecMetadata) => Context,
  templates: 'templates',
};

export default bundle;
`;
        
        const enrichCode = `import type { Context } from '@fixedcode/engine';
import type { SpecMetadata } from '@fixedcode/engine';

export function enrich(spec: Record<string, unknown>, _metadata: SpecMetadata): Context {
  // TODO: Implement enrichment
  return spec as unknown as Context;
}
`;
        
        writeFileSync(join(outputDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        writeFileSync(join(outputDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
        writeFileSync(join(outputDir, 'src/index.ts'), bundleCode);
        writeFileSync(join(outputDir, 'src/enrich/index.ts'), enrichCode);
        
        console.log(`Created bundle at ${outputDir}`);
        console.log(`  - package.json`);
        console.log(`  - tsconfig.json`);
        console.log(`  - src/index.ts`);
        console.log(`  - src/enrich/index.ts`);
        console.log(`  - templates/`);
        console.log('');
        console.log('Next steps:');
        console.log(`  cd ${outputDir}`);
        console.log('  npm install');
        console.log('  # Edit src/index.ts to set your bundle kind');
        console.log('  # Add spec schema to src/index.ts');
        console.log('  # Add templates to templates/');
      })
    );
}