import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Handlebars from 'handlebars';
import { enrich, generateFiles } from '../../src/index.js';

const md = { name: 'my-bff', apiVersion: '1.0' };

const AUDIT_FILE_TAILS = [
  'audit/AuditAction.kt',
  'audit/AuditEvent.kt',
  'audit/AuditLog.kt',
  'audit/AuditLogRepository.kt',
  'audit/AuditLogPublisher.kt',
  'audit/AuditLogEventListener.kt',
  'audit/AuditLogOutboundAdapter.kt',
  'dto/AuditLogDto.kt',
];

const baseSpec = {
  appName: 'my-bff',
  groupId: 'com.example',
  features: { database: true },
};

function renderTemplate(templatePath: string, ctx: Record<string, unknown>): string {
  const hb = Handlebars.create();
  hb.registerHelper('eq', (a: unknown, b: unknown) => a === b);
  hb.registerHelper('springProp', (...args: unknown[]) => {
    const params = args.slice(0, -1);
    const varName = String(params[0] ?? '');
    const hasDefault = params.length >= 2;
    const d = hasDefault ? `:${String(params[1] ?? '')}` : '';
    return `\${${varName}${d}}`;
  });
  hb.registerHelper('concat', (...args: unknown[]) => {
    const params = args.slice(0, -1);
    return params.map((p) => String(p ?? '')).join('');
  });
  const src = readFileSync(
    join(__dirname, '..', '..', 'templates', templatePath),
    'utf-8',
  );
  return hb.compile(src, { noEscape: true })(ctx);
}

describe('kotlin-spring-bff audit-log recipe', () => {
  it('does not generate audit-log files when recipe is disabled', () => {
    const ctx = enrich({ appName: 'my-bff', groupId: 'com.example' }, md);
    expect(ctx.recipeAuditLog).toBe(false);
    expect(ctx.recipes).toEqual([]);

    const outputs = generateFiles(ctx).map((f) => f.output);
    for (const tail of AUDIT_FILE_TAILS) {
      expect(outputs.some((o) => o.endsWith(tail))).toBe(false);
    }
    expect(outputs.some((o) => o.endsWith('V100__audit_log.sql'))).toBe(false);
  });

  it('throws a clear error when recipe is enabled but features.database is off', () => {
    expect(() =>
      enrich(
        {
          appName: 'my-bff',
          groupId: 'com.example',
          recipes: ['audit-log'],
        },
        md,
      ),
    ).toThrow(/audit-log.*requires features\.database/i);
  });

  it('generates all audit files (and migration + yml) when enabled', () => {
    const ctx = enrich({ ...baseSpec, recipes: ['audit-log'] }, md);
    expect(ctx.recipeAuditLog).toBe(true);
    expect(ctx.recipeProfiles).toEqual(['audit-log']);

    const files = generateFiles(ctx);
    const outputs = files.map((f) => f.output);
    for (const tail of AUDIT_FILE_TAILS) {
      expect(outputs.some((o) => o.endsWith(tail)), `missing ${tail}`).toBe(true);
    }
    expect(outputs).toContain('src/main/resources/application-audit-log.yml');
    expect(outputs).toContain('src/main/resources/db/migration/V100__audit_log.sql');
    expect(outputs.some((o) => o.endsWith('AuditLogController.kt'))).toBe(true);

    // The outbound adapter is the documented extension point.
    const adapter = files.find((f) => f.output.endsWith('AuditLogOutboundAdapter.kt'));
    expect(adapter?.overwrite).toBe(false);
    // Migration file is `overwrite: false` — Flyway forbids retroactive edits.
    const migration = files.find((f) => f.output.endsWith('V100__audit_log.sql'));
    expect(migration?.overwrite).toBe(false);
    // Controller is an extension point — admin endpoint UX is opinionated.
    const controller = files.find((f) => f.output.endsWith('AuditLogController.kt'));
    expect(controller?.overwrite).toBe(false);
  });

  it('skips the admin controller when adminEndpoint is false', () => {
    const ctx = enrich(
      {
        ...baseSpec,
        recipes: ['audit-log'],
        auditLog: { adminEndpoint: false },
      },
      md,
    );
    expect(ctx.auditLog.adminEndpoint).toBe(false);
    const outputs = generateFiles(ctx).map((f) => f.output);
    expect(outputs.some((o) => o.endsWith('AuditLogController.kt'))).toBe(false);
    // The repository/publisher/etc are still generated — domain code can call
    // them without an HTTP surface.
    expect(outputs.some((o) => o.endsWith('AuditLogPublisher.kt'))).toBe(true);
  });

  it('listener template branches on hasActorHeader to avoid an HttpServletRequest dep when disabled', () => {
    const ctxWithHeader = enrich({ ...baseSpec, recipes: ['audit-log'] }, md);
    const renderedDefault = renderTemplate(
      'recipes/audit-log/audit/AuditLogEventListener.kt.hbs',
      ctxWithHeader as unknown as Record<string, unknown>,
    );
    expect(renderedDefault).toContain('private val request: HttpServletRequest');
    expect(renderedDefault).toContain('request.getHeader("X-Actor")');

    const ctxNoHeader = enrich(
      { ...baseSpec, recipes: ['audit-log'], auditLog: { actorHeader: '' } },
      md,
    );
    expect(ctxNoHeader.auditLog.hasActorHeader).toBe(false);
    const renderedNoHeader = renderTemplate(
      'recipes/audit-log/audit/AuditLogEventListener.kt.hbs',
      ctxNoHeader as unknown as Record<string, unknown>,
    );
    expect(renderedNoHeader).not.toContain('HttpServletRequest');
    expect(renderedNoHeader).not.toContain('getHeader');
  });

  it('SecurityConfig locks /api/audit-log/** to ROLE_ADMIN when paired with users-management', () => {
    const ctx = enrich(
      {
        ...baseSpec,
        recipes: ['audit-log', 'users-management'],
      },
      md,
    );
    const rendered = renderTemplate(
      'src/main/kotlin/config/SecurityConfig.kt.hbs',
      ctx as unknown as Record<string, unknown>,
    );
    expect(rendered).toContain('"/api/audit-log/**"');
    expect(rendered).toMatch(/\/api\/audit-log\/\*\*"\)\.hasRole\("ADMIN"\)/);
  });

  it('SecurityConfig does NOT mention audit-log routes when only audit-log is enabled (no users-management)', () => {
    const ctx = enrich({ ...baseSpec, recipes: ['audit-log'] }, md);
    // Without users-management, SecurityConfig isn't generated unless features.auth is jwt/oauth2.
    // When it IS generated, the audit-log block is gated on recipeUsersManagement (matches the
    // existing /api/users/** block), so it's silently skipped — that's the intended behaviour
    // (audit-log is internal plumbing without users-management).
    expect(ctx.authEnabled).toBe(false);
    const outputs = generateFiles(ctx).map((f) => f.output);
    expect(outputs.some((o) => o.endsWith('SecurityConfig.kt'))).toBe(false);
  });

  it('AuditLogPublisher exposes created/updated/deleted facade methods', () => {
    const rendered = renderTemplate(
      'recipes/audit-log/audit/AuditLogPublisher.kt.hbs',
      { packageName: 'com.example.mybff' } as unknown as Record<string, unknown>,
    );
    expect(rendered).toContain('fun created(');
    expect(rendered).toContain('fun updated(');
    expect(rendered).toContain('fun deleted(');
    // All three call the same private publish() shim that fires the Spring event.
    expect(rendered).toContain('publisher.publishEvent(');
  });

  it('V100 migration creates the audit_log table with the indexes the FE will rely on', () => {
    const sql = readFileSync(
      join(
        __dirname,
        '..',
        '..',
        'templates',
        'recipes',
        'audit-log',
        'resources',
        'db',
        'V100__audit_log.sql.hbs',
      ),
      'utf-8',
    );
    expect(sql).toContain('CREATE TABLE audit_log');
    expect(sql).toContain('CREATE INDEX idx_audit_log_aggregate');
    expect(sql).toContain('CREATE INDEX idx_audit_log_actor');
    expect(sql).toContain('CREATE INDEX idx_audit_log_occurred_at');
    expect(sql).toContain('JSONB');
  });

  it('composes with users-management + pagination-filter-sort', () => {
    const ctx = enrich(
      {
        ...baseSpec,
        recipes: ['audit-log', 'users-management', 'pagination-filter-sort'],
      },
      md,
    );
    expect(ctx.recipeAuditLog).toBe(true);
    expect(ctx.recipeUsersManagement).toBe(true);
    expect(ctx.recipePaginationFilterSort).toBe(true);
    // Profile order is fixed by enrich(), independent of recipe-list order.
    expect(ctx.recipeProfiles).toEqual([
      'users-management',
      'pagination-filter-sort',
      'audit-log',
    ]);
  });
});
