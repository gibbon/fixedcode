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

  // Recipe: users-management
  if (ctx.recipeUsersManagement) {
    files.push(
      {
        template: 'recipes/users-management/api/AuthController.kt.hbs',
        output: `src/main/kotlin/${pkg}/api/AuthController.kt`,
        ctx: c,
      },
      {
        template: 'recipes/users-management/api/UsersController.kt.hbs',
        output: `src/main/kotlin/${pkg}/api/UsersController.kt`,
        ctx: c,
      },
      {
        template: 'recipes/users-management/auth/JwtAuthenticationFilter.kt.hbs',
        output: `src/main/kotlin/${pkg}/auth/JwtAuthenticationFilter.kt`,
        ctx: c,
      },
      {
        template: 'recipes/users-management/auth/JwtService.kt.hbs',
        output: `src/main/kotlin/${pkg}/auth/JwtService.kt`,
        ctx: c,
        overwrite: false,
      },
      {
        template: 'recipes/users-management/auth/PasswordHasher.kt.hbs',
        output: `src/main/kotlin/${pkg}/auth/PasswordHasher.kt`,
        ctx: c,
        overwrite: false,
      },
      {
        template: 'recipes/users-management/domain/User.kt.hbs',
        output: `src/main/kotlin/${pkg}/domain/User.kt`,
        ctx: c,
      },
      {
        template: 'recipes/users-management/domain/UserRepository.kt.hbs',
        output: `src/main/kotlin/${pkg}/domain/UserRepository.kt`,
        ctx: c,
      },
      {
        template: 'recipes/users-management/dto/UserDto.kt.hbs',
        output: `src/main/kotlin/${pkg}/dto/UserDto.kt`,
        ctx: c,
      },
      {
        template: 'recipes/users-management/dto/SignUpRequest.kt.hbs',
        output: `src/main/kotlin/${pkg}/dto/SignUpRequest.kt`,
        ctx: c,
      },
      {
        template: 'recipes/users-management/dto/SignInRequest.kt.hbs',
        output: `src/main/kotlin/${pkg}/dto/SignInRequest.kt`,
        ctx: c,
      },
      {
        template: 'recipes/users-management/dto/AuthResponse.kt.hbs',
        output: `src/main/kotlin/${pkg}/dto/AuthResponse.kt`,
        ctx: c,
      },
      {
        template: 'recipes/users-management/dto/UpdateRoleRequest.kt.hbs',
        output: `src/main/kotlin/${pkg}/dto/UpdateRoleRequest.kt`,
        ctx: c,
      },
      {
        template: 'recipes/users-management/resources/application-users-management.yml.hbs',
        output: 'src/main/resources/application-users-management.yml',
        ctx: c,
      },
      {
        template: 'recipes/users-management/resources/db/V001__users.sql.hbs',
        output: 'src/main/resources/db/migration/V001__users.sql',
        ctx: c,
      },
    );
  }

  // Recipe: pagination-filter-sort
  if (ctx.recipePaginationFilterSort) {
    files.push(
      {
        template: 'recipes/pagination-filter-sort/pagination/PageRequest.kt.hbs',
        output: `src/main/kotlin/${pkg}/pagination/PageRequest.kt`,
        ctx: c,
      },
      {
        template: 'recipes/pagination-filter-sort/pagination/PageResponse.kt.hbs',
        output: `src/main/kotlin/${pkg}/pagination/PageResponse.kt`,
        ctx: c,
      },
      {
        template: 'recipes/pagination-filter-sort/pagination/SortSpec.kt.hbs',
        output: `src/main/kotlin/${pkg}/pagination/SortSpec.kt`,
        ctx: c,
      },
      {
        template: 'recipes/pagination-filter-sort/pagination/FilterSpec.kt.hbs',
        output: `src/main/kotlin/${pkg}/pagination/FilterSpec.kt`,
        ctx: c,
      },
      {
        template: 'recipes/pagination-filter-sort/pagination/PaginationProperties.kt.hbs',
        output: `src/main/kotlin/${pkg}/pagination/PaginationProperties.kt`,
        ctx: c,
      },
      {
        template: 'recipes/pagination-filter-sort/pagination/PageRequestArgumentResolver.kt.hbs',
        output: `src/main/kotlin/${pkg}/pagination/PageRequestArgumentResolver.kt`,
        ctx: c,
      },
      {
        template: 'recipes/pagination-filter-sort/pagination/PaginationWebConfig.kt.hbs',
        output: `src/main/kotlin/${pkg}/pagination/PaginationWebConfig.kt`,
        ctx: c,
      },
      {
        template:
          'recipes/pagination-filter-sort/resources/application-pagination-filter-sort.yml.hbs',
        output: 'src/main/resources/application-pagination-filter-sort.yml',
        ctx: c,
      },
    );
  }

  // Recipe: audit-log
  if (ctx.recipeAuditLog) {
    files.push(
      {
        template: 'recipes/audit-log/audit/AuditAction.kt.hbs',
        output: `src/main/kotlin/${pkg}/audit/AuditAction.kt`,
        ctx: c,
      },
      {
        template: 'recipes/audit-log/audit/AuditEvent.kt.hbs',
        output: `src/main/kotlin/${pkg}/audit/AuditEvent.kt`,
        ctx: c,
      },
      {
        template: 'recipes/audit-log/audit/AuditLog.kt.hbs',
        output: `src/main/kotlin/${pkg}/audit/AuditLog.kt`,
        ctx: c,
      },
      {
        template: 'recipes/audit-log/audit/AuditLogRepository.kt.hbs',
        output: `src/main/kotlin/${pkg}/audit/AuditLogRepository.kt`,
        ctx: c,
      },
      {
        template: 'recipes/audit-log/audit/AuditLogPublisher.kt.hbs',
        output: `src/main/kotlin/${pkg}/audit/AuditLogPublisher.kt`,
        ctx: c,
      },
      {
        template: 'recipes/audit-log/audit/AuditLogEventListener.kt.hbs',
        output: `src/main/kotlin/${pkg}/audit/AuditLogEventListener.kt`,
        ctx: c,
      },
      {
        template: 'recipes/audit-log/audit/AuditLogOutboundAdapter.kt.hbs',
        output: `src/main/kotlin/${pkg}/audit/AuditLogOutboundAdapter.kt`,
        ctx: c,
        overwrite: false,
      },
      {
        template: 'recipes/audit-log/dto/AuditLogDto.kt.hbs',
        output: `src/main/kotlin/${pkg}/dto/AuditLogDto.kt`,
        ctx: c,
      },
      {
        template: 'recipes/audit-log/resources/application-audit-log.yml.hbs',
        output: 'src/main/resources/application-audit-log.yml',
        ctx: c,
      },
      {
        template: 'recipes/audit-log/resources/db/V100__audit_log.sql.hbs',
        output: 'src/main/resources/db/migration/V100__audit_log.sql',
        ctx: c,
        overwrite: false,
      },
    );
    if (ctx.auditLog.adminEndpoint) {
      files.push({
        template: 'recipes/audit-log/api/AuditLogController.kt.hbs',
        output: `src/main/kotlin/${pkg}/api/AuditLogController.kt`,
        ctx: c,
        overwrite: false,
      });
    }
  }

  // Recipe: image-upload
  if (ctx.recipeImageUpload) {
    files.push(
      {
        template: 'recipes/image-upload/api/ImagesController.kt.hbs',
        output: `src/main/kotlin/${pkg}/api/ImagesController.kt`,
        ctx: c,
      },
      {
        template: 'recipes/image-upload/service/ImageService.kt.hbs',
        output: `src/main/kotlin/${pkg}/service/ImageService.kt`,
        ctx: c,
      },
      {
        template: 'recipes/image-upload/service/LocalImageService.kt.hbs',
        output: `src/main/kotlin/${pkg}/service/LocalImageService.kt`,
        ctx: c,
        overwrite: false,
      },
      {
        template: 'recipes/image-upload/dto/ImageDto.kt.hbs',
        output: `src/main/kotlin/${pkg}/dto/ImageDto.kt`,
        ctx: c,
      },
      {
        template: 'recipes/image-upload/exception/ImageNotFoundException.kt.hbs',
        output: `src/main/kotlin/${pkg}/exception/ImageNotFoundException.kt`,
        ctx: c,
      },
      {
        template: 'recipes/image-upload/exception/ImageProcessingException.kt.hbs',
        output: `src/main/kotlin/${pkg}/exception/ImageProcessingException.kt`,
        ctx: c,
      },
      {
        template: 'recipes/image-upload/resources/application-image-upload.yml.hbs',
        output: 'src/main/resources/application-image-upload.yml',
        ctx: c,
      },
    );
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
