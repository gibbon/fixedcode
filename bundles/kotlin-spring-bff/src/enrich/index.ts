import type { Context, SpecMetadata } from 'fixedcode';
import {
  parseSpec,
  type AuthMode,
  type RecipeName,
  type NormalizedUsersManagementConfig,
} from './spec.js';
import { generateVariants, toFlatPackageSegment, type NamingVariants } from './naming.js';

export interface ServiceContext {
  /** raw kebab-case name from spec */
  name: string;
  /** all-cases of the service name */
  naming: NamingVariants;
  /** default base URL */
  baseUrl: string;
  /** uppercase env var name, e.g. CATALOG_BASE_URL */
  envVar: string;
  /** YAML config key under app.services, e.g. catalog */
  configKey: string;
  /** circuit breaker / bean qualifier name, e.g. catalogClient */
  beanName: string;
}

export interface KotlinSpringBffContext extends Context {
  appName: NamingVariants;
  /** full package, e.g. com.example.mybff */
  packageName: string;
  /** package as path segments, e.g. com/example/mybff */
  packagePath: string;
  /** group id only, e.g. com.example */
  groupId: string;
  /** group id as slashed path, e.g. com/example */
  groupIdPath: string;
  /** flattened, lowercase package leaf, e.g. mybff */
  appPackageSegment: string;
  port: number;
  javaVersion: number;
  services: ServiceContext[];
  hasServices: boolean;
  features: {
    auth: AuthMode;
    database: boolean;
    cache: boolean;
    docker: boolean;
  };
  authJwt: boolean;
  authOauth2: boolean;
  authEnabled: boolean;
  recipes: RecipeName[];
  recipeImageUpload: boolean;
  recipeUsersManagement: boolean;
  usersManagement: NormalizedUsersManagementConfig;
  /**
   * Effective auth wiring after recipes apply: when users-management is enabled,
   * the bundle becomes a JWT issuer/verifier even if features.auth was 'none'.
   */
  effectiveAuthJwt: boolean;
}

export function enrich(
  raw: Record<string, unknown>,
  _metadata: SpecMetadata,
): KotlinSpringBffContext {
  const spec = parseSpec(raw);
  const appName = generateVariants(spec.appName);
  const appPackageSegment = toFlatPackageSegment(spec.appName);
  const groupIdPath = spec.groupId.replace(/\./g, '/');
  const packageName = `${spec.groupId}.${appPackageSegment}`;
  const packagePath = `${groupIdPath}/${appPackageSegment}`;

  const services: ServiceContext[] = spec.services.map((svc) => {
    const naming = generateVariants(svc.name);
    return {
      name: svc.name,
      naming,
      baseUrl: svc.baseUrl,
      envVar: `${naming.snake.toUpperCase()}_BASE_URL`,
      configKey: naming.kebab,
      beanName: `${naming.camel}Client`,
    };
  });

  const recipeUsersManagement = spec.recipes.includes('users-management');

  // The users-management recipe persists users + password hashes — that requires JPA.
  if (recipeUsersManagement && !spec.features.database) {
    throw new Error(
      '[kotlin-spring-bff:users-management] recipe "users-management" requires features.database: true ' +
        '(it persists users + password hashes via Spring Data JPA + Flyway). ' +
        'Set `features: { database: true }` in your spec.',
    );
  }

  const authJwt = spec.features.auth === 'jwt';
  const authOauth2 = spec.features.auth === 'oauth2';
  const authEnabled = spec.features.auth !== 'none' || recipeUsersManagement;
  // The recipe brings JJWT + Spring Security regardless of features.auth — so
  // build.gradle conditionals can key off effectiveAuthJwt.
  const effectiveAuthJwt = authJwt || recipeUsersManagement;

  return {
    appName,
    packageName,
    packagePath,
    groupId: spec.groupId,
    groupIdPath,
    appPackageSegment,
    port: spec.port,
    javaVersion: spec.javaVersion,
    services,
    hasServices: services.length > 0,
    features: spec.features,
    authJwt,
    authOauth2,
    authEnabled,
    recipes: spec.recipes,
    recipeImageUpload: spec.recipes.includes('image-upload'),
    recipeUsersManagement,
    usersManagement: spec.usersManagement,
    effectiveAuthJwt,
  };
}
