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

  /**
   * Optional alternative to the directory-walk render path.
   * If present, the engine calls this instead of renderTemplates().
   * Returns an explicit list of files to generate with per-file contexts.
   */
  generateFiles?: (ctx: Context) => FileEntry[];

  /**
   * Optional adapters that map this bundle's enriched context into
   * the input shape expected by named generators.
   * Key = generator name (e.g. 'openapi'), value = mapping function.
   */
  adapters?: Record<string, (ctx: Context) => Record<string, unknown>>;

  /**
   * Optional CFR (Cross-Functional Requirements) manifest.
   * Declares which CFRs this bundle bakes in and which files implement each one.
   */
  cfrs?: {
    provides: string[];
    files?: Record<string, string[]>;
  };
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

/**
 * A single file to generate, returned by a bundle's generateFiles() function.
 * template: path relative to the bundle's templates/ directory
 * output: path relative to the generation output directory
 * ctx: context for rendering this specific file
 */
export interface FileEntry {
  template: string;
  output: string;
  ctx: Record<string, unknown>;
  /**
   * Whether to overwrite this file if it already exists. Default: true.
   * Set to false for extension points (e.g. DefaultBusinessService)
   * that should only be generated once and then owned by the user.
   */
  overwrite?: boolean;
}

export interface RenderedFileWithMeta extends RenderedFile {
  /** Whether to overwrite if file exists. Default: true. */
  overwrite: boolean;
}

/**
 * A generator is a programmatic (non-template) file producer.
 * It defines a named input contract and produces files from that input.
 * Generators are standalone packages — they don't depend on any specific bundle.
 */
export interface Generator {
  /** Unique name used to match with bundle adapters (e.g. 'openapi') */
  name: string;

  /** Produce files from the adapter-provided input */
  generate(input: Record<string, unknown>): RenderedFile[];
}

export interface LlmConfig {
  provider: 'openrouter' | 'ollama' | 'openai';
  model: string;
  baseUrl?: string;
  apiKeyEnv?: string;
}

export interface FixedCodeConfig {
  bundles: Record<string, string>;
  generators?: Record<string, string>;
  /** Directory the config was loaded from — used to resolve relative bundle paths */
  configDir: string;
  llm?: LlmConfig;
}