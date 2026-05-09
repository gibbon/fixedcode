export type AuthMode = 'jwt' | 'oauth2' | 'none';

export type RecipeName = 'image-upload' | 'users-management';
export const KNOWN_RECIPES: readonly RecipeName[] = ['image-upload', 'users-management'] as const;

export interface RawServiceEntry {
  name: string;
  baseUrl: string;
}

export interface RawUsersManagementConfig {
  tokenTtlMinutes?: number;
  defaultAdminEmail?: string;
}

export interface NormalizedUsersManagementConfig {
  tokenTtlMinutes: number;
  defaultAdminEmail: string;
}

export interface RawBffSpec {
  appName: string;
  groupId: string;
  port?: number;
  javaVersion?: number;
  services?: RawServiceEntry[];
  features?: {
    auth?: AuthMode;
    database?: boolean;
    cache?: boolean;
    docker?: boolean;
  };
  recipes?: string[];
  usersManagement?: RawUsersManagementConfig;
}

export interface ParsedBffSpec {
  appName: string;
  groupId: string;
  port: number;
  javaVersion: number;
  services: RawServiceEntry[];
  features: {
    auth: AuthMode;
    database: boolean;
    cache: boolean;
    docker: boolean;
  };
  recipes: RecipeName[];
  usersManagement: NormalizedUsersManagementConfig;
}

export function parseSpec(raw: Record<string, unknown>): ParsedBffSpec {
  const r = raw as unknown as RawBffSpec;
  if (!r.appName) throw new Error('kotlin-spring-bff: appName is required');
  if (!r.groupId) throw new Error('kotlin-spring-bff: groupId is required');
  const recipes: RecipeName[] = Array.isArray(r.recipes)
    ? r.recipes.filter((x): x is RecipeName => (KNOWN_RECIPES as readonly string[]).includes(x))
    : [];
  return {
    appName: r.appName,
    groupId: r.groupId,
    port: r.port ?? 8080,
    javaVersion: r.javaVersion ?? 21,
    services: Array.isArray(r.services) ? r.services : [],
    features: {
      auth: r.features?.auth ?? 'none',
      database: r.features?.database ?? false,
      cache: r.features?.cache ?? false,
      docker: r.features?.docker ?? true,
    },
    recipes,
    usersManagement: {
      tokenTtlMinutes: r.usersManagement?.tokenTtlMinutes ?? 1440,
      defaultAdminEmail: r.usersManagement?.defaultAdminEmail ?? 'admin@example.com',
    },
  };
}
