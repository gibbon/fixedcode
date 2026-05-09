import type { Context, SpecMetadata } from 'fixedcode';
import { parseSpec, type AuthMode, type RecipeName } from './spec.js';
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
    authJwt: spec.features.auth === 'jwt',
    authOauth2: spec.features.auth === 'oauth2',
    authEnabled: spec.features.auth !== 'none',
    recipes: spec.recipes,
    recipeImageUpload: spec.recipes.includes('image-upload'),
  };
}
