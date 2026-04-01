/**
 * The contract between the engine and any bundle.
 * A bundle is a directory or npm package with a default export conforming to this interface.
 */
export interface Bundle {
  /** Routes specs to this bundle via the `kind` field in the spec envelope */
  kind: string;

  /** JSON Schema that validates the `spec:` body of matching specs */
  specSchema: Record<string, unknown>;

  /** Transforms raw spec body into a rich context for template rendering */
  enrich(spec: Record<string, unknown>, metadata: SpecMetadata): Context;

  /** Relative path (from bundle root) to the Handlebars templates directory */
  templates: string;

  /** Optional custom Handlebars helpers available in this bundle's templates */
  helpers?: Record<string, (...args: unknown[]) => unknown>;

  /** Optional named Handlebars partial templates */
  partials?: Record<string, string>;
}

export interface SpecMetadata {
  name: string;
  description?: string;
  apiVersion: string;
}

/** Opaque at the engine level — each bundle defines its own shape */
export type Context = Record<string, unknown>;

export interface RawSpec {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    description?: string;
  };
  spec: Record<string, unknown>;
}

export interface RenderedFile {
  /** Relative output path */
  path: string;
  /** Rendered content */
  content: string;
}

export interface FixedCodeConfig {
  bundles: Record<string, string>;
  /** Directory the config was loaded from — used to resolve relative bundle paths */
  configDir: string;
}