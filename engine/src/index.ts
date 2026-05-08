export type {
  Bundle,
  SpecMetadata,
  Context,
  RawSpec,
  RenderedFile,
  FixedCodeConfig,
  FileEntry,
  Generator,
} from './types.js';
export {
  FixedCodeError,
  SpecParseError,
  EnvelopeError,
  BundleNotFoundError,
  BundleLoadError,
  SpecValidationError,
  EnrichmentError,
  RenderError,
  WriteError,
  LlmError,
  EnrichError,
} from './errors.js';

export { generate, validate } from './engine/pipeline.js';
export { build } from './engine/build.js';
export { deploy } from './engine/deploy.js';
export { verify } from './engine/verify.js';
export { renderTemplates, createHandlebarsEnv, renderFile } from './engine/render.js';
export type { TemplateOptions } from './engine/render.js';
export { createProgram } from './cli/index.js';
export {
  fetchRegistry,
  searchRegistry,
  listRegistry,
  installPackage,
  publishPackage,
} from './engine/registry.js';
export type {
  RegistryPackage,
  Registry,
  InstallResult,
  PublishOptions,
} from './engine/registry.js';
