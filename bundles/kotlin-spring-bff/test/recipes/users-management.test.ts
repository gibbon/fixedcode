import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { enrich, generateFiles } from '../../src/index.js';

const md = { name: 'my-bff', apiVersion: '1.0' };

const USERS_FILE_TAILS = [
  'api/AuthController.kt',
  'api/UsersController.kt',
  'auth/JwtAuthenticationFilter.kt',
  'auth/JwtService.kt',
  'auth/PasswordHasher.kt',
  'domain/User.kt',
  'domain/UserRepository.kt',
  'dto/UserDto.kt',
  'dto/SignUpRequest.kt',
  'dto/SignInRequest.kt',
  'dto/AuthResponse.kt',
  'dto/UpdateRoleRequest.kt',
];

const baseSpec = {
  appName: 'my-bff',
  groupId: 'com.example',
  features: { database: true },
};

describe('kotlin-spring-bff users-management recipe', () => {
  it('does not generate any users-management files when recipe is disabled', () => {
    const ctx = enrich({ appName: 'my-bff', groupId: 'com.example' }, md);
    expect(ctx.recipeUsersManagement).toBe(false);
    expect(ctx.recipes).toEqual([]);
    const files = generateFiles(ctx);
    const userOutputs = files.filter(
      (f) =>
        f.output.endsWith('AuthController.kt') ||
        f.output.endsWith('UsersController.kt') ||
        f.output.endsWith('JwtService.kt') ||
        f.output.endsWith('User.kt') ||
        f.output.endsWith('application-users-management.yml') ||
        f.output.endsWith('V001__users.sql'),
    );
    expect(userOutputs).toEqual([]);
  });

  it('throws a clear error when recipe is enabled but features.database is off', () => {
    expect(() =>
      enrich(
        {
          appName: 'my-bff',
          groupId: 'com.example',
          recipes: ['users-management'],
        },
        md,
      ),
    ).toThrow(/users-management.*requires features\.database/i);
  });

  it('generates all users-management files (and config + migration) when recipe is enabled', () => {
    const ctx = enrich({ ...baseSpec, recipes: ['users-management'] }, md);
    expect(ctx.recipeUsersManagement).toBe(true);
    expect(ctx.recipes).toEqual(['users-management']);
    expect(ctx.effectiveAuthJwt).toBe(true);
    expect(ctx.authEnabled).toBe(true);

    const files = generateFiles(ctx);
    const outputs = files.map((f) => f.output);
    for (const tail of USERS_FILE_TAILS) {
      expect(
        outputs.some((o) => o.endsWith(tail)),
        `missing ${tail}`,
      ).toBe(true);
    }
    expect(outputs).toContain('src/main/resources/application-users-management.yml');
    expect(outputs).toContain('src/main/resources/db/migration/V001__users.sql');

    // SecurityConfig should also be generated (effectiveAuthJwt true → authEnabled true)
    expect(outputs.some((o) => o.endsWith('config/SecurityConfig.kt'))).toBe(true);

    // JwtService and PasswordHasher are extension points
    const jwtSvc = files.find((f) => f.output.endsWith('JwtService.kt'));
    expect(jwtSvc?.overwrite).toBe(false);
    const hasher = files.find((f) => f.output.endsWith('PasswordHasher.kt'));
    expect(hasher?.overwrite).toBe(false);

    // application-users-management.yml carries the jwtSecret config key
    const yml = readFileSync(
      join(
        __dirname,
        '..',
        '..',
        'templates',
        'recipes',
        'users-management',
        'resources',
        'application-users-management.yml.hbs',
      ),
      'utf-8',
    );
    expect(yml).toContain('jwtSecret:');
    expect(yml).toContain('tokenTtlMinutes:');
  });

  it('SecurityConfig template includes users-management routing rules', () => {
    const tpl = readFileSync(
      join(
        __dirname,
        '..',
        '..',
        'templates',
        'src',
        'main',
        'kotlin',
        'config',
        'SecurityConfig.kt.hbs',
      ),
      'utf-8',
    );
    expect(tpl).toContain('/api/auth/sign-up');
    expect(tpl).toContain('/api/auth/sign-in');
    expect(tpl).toContain('/api/users/**');
    expect(tpl).toMatch(/hasRole\("ADMIN"\)/);
    expect(tpl).toContain('JwtAuthenticationFilter');
  });
});
