import { resolve, dirname } from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { loadConfig } from './config.js';
import { resolveBundle } from './resolve.js';
import { validateBody } from './validate.js';
import { resolveLlmConfig, chatCompletion } from './llm.js';
import { DraftError } from '../errors.js';
import type { FixedCodeConfig } from '../types.js';

export interface DraftOptions {
  kind: string;
  description: string;
  output?: string;
  retry?: boolean;
  configPath?: string;
  llmOverrides?: { provider?: string; model?: string };
}

export interface PromptParts {
  system: string;
  user: string;
}

interface BuildPromptInput {
  kind: string;
  description: string;
  schema: Record<string, unknown>;
  conventions?: string;
  example?: string;
}

/**
 * Extract YAML content from LLM response, stripping markdown fences if present.
 */
export function extractYaml(raw: string): string {
  const trimmed = raw.trim();
  // Match ```yaml ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/^```(?:ya?ml)?\s*\n([\s\S]*?)\n?```\s*$/);
  if (fenceMatch) {
    return fenceMatch[1];
  }
  return raw;
}

/**
 * Build the system and user prompts for the draft command.
 */
export function buildDraftPrompt(input: BuildPromptInput): PromptParts {
  let system = `You are a code generation spec author for FixedCode.

Given a natural language description, produce a YAML spec that conforms to the following schema and conventions.

## Spec Envelope

Every spec has this structure:
\`\`\`yaml
apiVersion: "1.0"
kind: ${input.kind}
metadata:
  name: <derived-from-description>
  description: <one-line summary>
spec:
  <body conforming to schema below>
\`\`\`

## Schema

\`\`\`json
${JSON.stringify(input.schema, null, 2)}
\`\`\``;

  if (input.conventions) {
    system += `\n\n## Conventions\n\n${input.conventions}`;
  }

  if (input.example) {
    system += `\n\n## Example\n\n\`\`\`yaml\n${input.example}\n\`\`\``;
  }

  system += `\n\n## Rules

- Output ONLY the YAML spec. No explanation, no markdown fences, no commentary.
- The spec MUST validate against the schema above.
- Use the conventions for naming if provided.
- Prefer explicit over implicit — include all fields rather than relying on defaults.`;

  return { system, user: input.description };
}

/**
 * Load example specs from a bundle's examples/ directory.
 * Returns the first .yaml file (sorted alphabetically), or undefined.
 */
function loadBundleExample(bundleDir: string): string | undefined {
  const examplesDir = resolve(bundleDir, 'examples');
  if (!existsSync(examplesDir)) return undefined;

  const files = readdirSync(examplesDir)
    .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    .sort();

  if (files.length === 0) return undefined;
  return readFileSync(resolve(examplesDir, files[0]), 'utf-8');
}

/**
 * Extract spec conventions from CLAUDE.md if it exists.
 * Looks for the section about spec conventions (command naming, field syntax, etc.)
 */
function loadConventions(configDir: string, kind: string): string | undefined {
  const claudeMdPath = resolve(configDir, 'CLAUDE.md');
  if (!existsSync(claudeMdPath)) return undefined;

  const content = readFileSync(claudeMdPath, 'utf-8');

  // Look for a kind-specific conventions section (e.g. "### spring-domain spec conventions")
  const kindRegex = new RegExp(`### ${kind} spec conventions\\n([\\s\\S]*?)(?=\\n## |\\n### |$)`);
  const kindMatch = content.match(kindRegex);
  if (kindMatch) {
    return kindMatch[1].trim();
  }

  // Fallback: look for a generic "Spec Format" section
  const specFormatMatch = content.match(/## Spec Format\n([\s\S]*?)(?=\n## |$)/);
  if (specFormatMatch) {
    return specFormatMatch[1].trim();
  }

  return undefined;
}

/**
 * Draft a YAML spec from a natural language description.
 */
export async function draft(options: DraftOptions): Promise<string> {
  const config = loadConfig(process.cwd(), options.configPath);
  const llmConfig = resolveLlmConfig(config, options.llmOverrides);

  // Resolve bundle to get schema
  const bundle = await resolveBundle(options.kind, config);

  // Resolve bundle directory for examples
  const bundlePath = config.bundles[bundle.kind];
  const bundleDir = bundlePath.startsWith('@')
    ? resolve(config.configDir, 'node_modules', ...bundlePath.split('/'))
    : resolve(config.configDir, bundlePath);

  // Build prompt
  const example = loadBundleExample(bundleDir);
  const conventions = loadConventions(config.configDir, options.kind);
  const prompt = buildDraftPrompt({
    kind: options.kind,
    description: options.description,
    schema: bundle.specSchema,
    conventions,
    example,
  });

  // Call LLM
  const response = await chatCompletion(llmConfig, [
    { role: 'system', content: prompt.system },
    { role: 'user', content: prompt.user },
  ]);

  let yaml = extractYaml(response);

  // Validate
  let validationError = tryValidate(yaml, bundle.specSchema);

  // Retry once if invalid and retry is enabled (default true)
  if (validationError && options.retry !== false) {
    const retryResponse = await chatCompletion(llmConfig, [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
      { role: 'assistant', content: response },
      { role: 'user', content: `The YAML spec has validation errors:\n${validationError}\n\nPlease fix the errors and output the corrected YAML spec only.` },
    ]);

    yaml = extractYaml(retryResponse);
    validationError = tryValidate(yaml, bundle.specSchema);
  }

  if (validationError) {
    console.warn(`Warning: generated spec has validation errors:\n${validationError}`);
  }

  // Write output
  if (options.output) {
    const outputPath = resolve(options.output);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, yaml + '\n', 'utf-8');
    console.log(`Spec written to ${options.output}`);
  }

  return yaml;
}

/**
 * Try to validate a YAML string against a bundle schema.
 * Returns error message if invalid, undefined if valid.
 */
function tryValidate(yaml: string, schema: Record<string, unknown>): string | undefined {
  try {
    const parsed = parseYaml(yaml);
    if (!parsed || typeof parsed !== 'object') {
      return 'Invalid YAML: not an object';
    }

    const spec = (parsed as any).spec;
    if (!spec) {
      return 'Missing spec: field in YAML';
    }

    validateBody(spec, schema);
    return undefined;
  } catch (err) {
    return err instanceof Error ? err.message : 'Validation failed';
  }
}
