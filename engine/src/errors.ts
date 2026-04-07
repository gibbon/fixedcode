export class FixedCodeError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FixedCodeError';
  }
}

export class SpecParseError extends FixedCodeError {
  constructor(message: string) {
    super(message, 'SPEC_PARSE_ERROR');
    this.name = 'SpecParseError';
  }
}

export class EnvelopeError extends FixedCodeError {
  constructor(message: string) {
    super(message, 'ENVELOPE_ERROR');
    this.name = 'EnvelopeError';
  }
}

export class BundleNotFoundError extends FixedCodeError {
  constructor(kind: string) {
    super(`No bundle registered for kind '${kind}'. Check .fixedcode.yaml`, 'BUNDLE_NOT_FOUND');
    this.name = 'BundleNotFoundError';
  }
}

export class BundleLoadError extends FixedCodeError {
  constructor(bundle: string, reason: string) {
    super(`Bundle '${bundle}' failed to load: ${reason}`, 'BUNDLE_LOAD_ERROR');
    this.name = 'BundleLoadError';
  }
}

export class SpecValidationError extends FixedCodeError {
  constructor(message: string) {
    super(message, 'SPEC_VALIDATION_ERROR');
    this.name = 'SpecValidationError';
  }
}

export class EnrichmentError extends FixedCodeError {
  constructor(kind: string, reason: string) {
    super(`Enrichment failed in bundle '${kind}': ${reason}`, 'ENRICHMENT_ERROR');
    this.name = 'EnrichmentError';
  }
}

export class RenderError extends FixedCodeError {
  constructor(template: string, reason: string) {
    super(`Template error in ${template}: ${reason}`, 'RENDER_ERROR');
    this.name = 'RenderError';
  }
}

export class WriteError extends FixedCodeError {
  constructor(path: string, reason: string) {
    super(`Cannot write to ${path}: ${reason}`, 'WRITE_ERROR');
    this.name = 'WriteError';
  }
}

export class LlmError extends FixedCodeError {
  constructor(message: string) {
    super(message, 'LLM_ERROR');
    this.name = 'LlmError';
  }
}

export class EnrichError extends FixedCodeError {
  constructor(message: string) {
    super(message, 'ENRICH_ERROR');
    this.name = 'EnrichError';
  }
}