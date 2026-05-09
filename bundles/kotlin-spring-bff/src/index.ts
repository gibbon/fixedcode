import type { Bundle, Context, FileEntry, SpecMetadata } from 'fixedcode';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { enrich, type KotlinSpringBffContext, type ServiceContext } from './enrich/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(readFileSync(join(__dirname, '..', 'schema.json'), 'utf-8'));

export { enrich };
export type { KotlinSpringBffContext, ServiceContext };

export function generateFiles(ctx: KotlinSpringBffContext): FileEntry[] {
  const c = ctx as unknown as Record<string, unknown>;
  const pkg = ctx.packagePath; // e.g. com/example/mybff

  const files: FileEntry[] = [
    { template: 'build.gradle.kts.hbs', output: 'build.gradle.kts', ctx: c },
    { template: 'settings.gradle.kts.hbs', output: 'settings.gradle.kts', ctx: c },
    { template: 'gitignore.hbs', output: '.gitignore', ctx: c },
    { template: 'README.md.hbs', output: 'README.md', ctx: c },
    {
      template: 'src/main/resources/application.yml.hbs',
      output: 'src/main/resources/application.yml',
      ctx: c,
    },
    {
      template: 'src/main/resources/application-local.yml.hbs',
      output: 'src/main/resources/application-local.yml',
      ctx: c,
    },
    {
      template: 'src/main/kotlin/Application.kt.hbs',
      output: `src/main/kotlin/${pkg}/Application.kt`,
      ctx: c,
    },
    {
      template: 'src/main/kotlin/api/HealthController.kt.hbs',
      output: `src/main/kotlin/${pkg}/api/HealthController.kt`,
      ctx: c,
    },
    {
      template: 'src/main/kotlin/config/RestClientConfig.kt.hbs',
      output: `src/main/kotlin/${pkg}/config/RestClientConfig.kt`,
      ctx: c,
    },
  ];

  if (ctx.features.cache) {
    files.push({
      template: 'src/main/kotlin/config/CacheConfig.kt.hbs',
      output: `src/main/kotlin/${pkg}/config/CacheConfig.kt`,
      ctx: c,
    });
  }

  if (ctx.authEnabled) {
    files.push({
      template: 'src/main/kotlin/config/SecurityConfig.kt.hbs',
      output: `src/main/kotlin/${pkg}/config/SecurityConfig.kt`,
      ctx: c,
    });
  }

  if (ctx.features.docker) {
    files.push({ template: 'Dockerfile.hbs', output: 'Dockerfile', ctx: c });
  }

  // One typed client per composed downstream service
  for (const svc of ctx.services) {
    const fileCtx: Record<string, unknown> = { ...c, service: svc };
    files.push({
      template: 'src/main/kotlin/clients/ServiceClient.kt.hbs',
      output: `src/main/kotlin/${pkg}/clients/${svc.naming.pascal}Client.kt`,
      ctx: fileCtx,
    });
  }

  return files;
}

const helpers = {
  eq: (a: unknown, b: unknown) => a === b,
  joinList: (items: unknown, sep: unknown) => {
    const s = typeof sep === 'string' ? sep : ', ';
    if (!Array.isArray(items)) return '';
    return items.join(s);
  },
  /**
   * Render a Spring property reference: `${VAR:default}`.
   * Avoids the headache of emitting literal braces alongside Handlebars `{{ }}`.
   */
  springProp: (...args: unknown[]) => {
    // Handlebars passes a HelperOptions object as the final arg
    const params = args.slice(0, -1);
    const varName = String(params[0] ?? '');
    const hasDefault = params.length >= 2;
    const d = hasDefault ? `:${String(params[1] ?? '')}` : '';
    return `\${${varName}${d}}`;
  },
  concat: (...args: unknown[]) => {
    const params = args.slice(0, -1);
    return params.map((p) => String(p ?? '')).join('');
  },
};

export const bundle: Bundle = {
  kind: 'kotlin-spring-bff',
  specSchema: schema,
  enrich: enrich as unknown as Bundle['enrich'],
  generateFiles: generateFiles as unknown as Bundle['generateFiles'],
  templates: 'templates',
  helpers,
  cfrs: {
    provides: ['health-check', 'circuit-breaker', 'retry', 'logging', 'docker', 'openapi'],
    files: {
      'health-check': ['src/main/kotlin/{packagePath}/api/HealthController.kt'],
      'circuit-breaker': ['src/main/kotlin/{packagePath}/config/RestClientConfig.kt'],
      docker: ['Dockerfile'],
    },
  },
};

export default bundle;

// Re-export Context type alias for typing convenience downstream
export type _Context = Context;
export type _SpecMetadata = SpecMetadata;
