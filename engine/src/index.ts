export type { Bundle, SpecMetadata, Context, RawSpec, RenderedFile, FixedCodeConfig, FileEntry } from './types.js';
export {
  FixedCodeError, SpecParseError, EnvelopeError, BundleNotFoundError,
  BundleLoadError, SpecValidationError, EnrichmentError, RenderError, WriteError,
} from './errors.js';

export { generate, validate } from './engine/pipeline.js';
export { createProgram } from './cli/index.js';