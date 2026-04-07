import { resolve, dirname, basename, extname, join, relative } from 'node:path';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parse as parseYaml } from 'yaml';
import { loadConfig } from './config.js';
import { resolveBundle } from './resolve.js';
import { validateBody } from './validate.js';
import { resolveLlmConfig, chatCompletion, type ChatContentPart } from './llm.js';
import type { Bundle, FixedCodeConfig } from '../types.js';

export interface DraftOptions {
  kind: string;
  description: string;
  output?: string;
  retry?: boolean;
  configPath?: string;
  contextFiles?: string[];
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
  return trimmed;
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
  const escaped = kind.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const kindRegex = new RegExp(`### ${escaped} spec conventions\\n([\\s\\S]*?)(?=\\n## |\\n### |$)`);
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

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);
const SKIP_EXTENSIONS = new Set(['.pdf', '.tar', '.gz', '.bin', '.exe', '.class', '.o']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '__pycache__', '.venv', 'venv']);

/**
 * Expand a list of paths into individual files.
 * Handles: individual files, directories (recursive), and .zip files.
 */
export function expandPaths(paths: string[]): string[] {
  const files: string[] = [];

  for (const p of paths) {
    const absPath = resolve(p);
    if (!existsSync(absPath)) {
      console.warn(`Warning: context path not found, skipping: ${p}`);
      continue;
    }

    const stat = statSync(absPath);

    if (stat.isDirectory()) {
      collectFilesFromDir(absPath, files);
    } else if (extname(absPath).toLowerCase() === '.zip') {
      collectFilesFromZip(absPath, files);
    } else {
      files.push(absPath);
    }
  }

  return files;
}

function collectFilesFromDir(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFilesFromDir(fullPath, out);
    } else {
      out.push(fullPath);
    }
  }
}

function collectFilesFromZip(zipPath: string, out: string[]): void {
  const tmpDir = join(dirname(zipPath), `.fixedcode-unzip-${Date.now()}`);
  try {
    mkdirSync(tmpDir, { recursive: true });
    execFileSync('unzip', ['-qo', zipPath, '-d', tmpDir], { stdio: 'pipe' });
    collectFilesFromDir(tmpDir, out);
  } catch (err) {
    console.warn(`Warning: failed to unzip ${zipPath}: ${err instanceof Error ? err.message : 'unknown error'}`);
  }
}

/**
 * Load context files and return them as chat content parts.
 * Text files become text parts, images become image_url parts (base64 data URI).
 * Accepts individual files, directories, or zip archives.
 */
export function loadContextFiles(inputPaths: string[]): ChatContentPart[] {
  const filePaths = expandPaths(inputPaths);
  const parts: ChatContentPart[] = [];

  // Find common root for relative display names
  const commonRoot = filePaths.length > 1
    ? findCommonDir(filePaths)
    : dirname(filePaths[0] ?? '');

  for (const absPath of filePaths) {
    const ext = extname(absPath).toLowerCase();
    const displayName = relative(commonRoot, absPath) || basename(absPath);

    if (IMAGE_EXTENSIONS.has(ext)) {
      const data = readFileSync(absPath);
      const base64 = data.toString('base64');
      const mime = ext === '.png' ? 'image/png'
        : ext === '.gif' ? 'image/gif'
        : ext === '.webp' ? 'image/webp'
        : 'image/jpeg';
      parts.push({
        type: 'image_url',
        image_url: { url: `data:${mime};base64,${base64}` },
      });
      parts.push({ type: 'text', text: `[Image: ${displayName}]` });
    } else if (SKIP_EXTENSIONS.has(ext) || ext === '.zip') {
      // already handled zip at expand time; skip other binaries
      continue;
    } else {
      try {
        const content = readFileSync(absPath, 'utf-8');
        parts.push({ type: 'text', text: `### ${displayName}\n\n\`\`\`\n${content}\n\`\`\`` });
      } catch {
        // binary file that lacks a known extension — skip
        continue;
      }
    }
  }

  return parts;
}

function findCommonDir(paths: string[]): string {
  if (paths.length === 0) return '';
  let common = dirname(paths[0]);
  for (const p of paths.slice(1)) {
    while (!dirname(p).startsWith(common)) {
      common = dirname(common);
    }
  }
  return common;
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

  // Build user message — text description + optional context files
  const contextParts = options.contextFiles?.length
    ? loadContextFiles(options.contextFiles)
    : [];

  const userContent = contextParts.length > 0
    ? [
        { type: 'text' as const, text: prompt.user },
        { type: 'text' as const, text: '\n## Context Files\n' },
        ...contextParts,
      ]
    : prompt.user;

  // Call LLM
  const response = await chatCompletion(llmConfig, [
    { role: 'system', content: prompt.system },
    { role: 'user', content: userContent },
  ]);

  let yaml = extractYaml(response);

  // Validate
  let validationError = tryValidate(yaml, bundle);

  // Retry once if invalid and retry is enabled (default true)
  if (validationError && options.retry !== false) {
    const retryResponse = await chatCompletion(llmConfig, [
      { role: 'system', content: prompt.system },
      { role: 'user', content: userContent },
      { role: 'assistant', content: response },
      { role: 'user', content: `The YAML spec has validation errors:\n${validationError}\n\nPlease fix the errors and output the corrected YAML spec only.` },
    ]);

    yaml = extractYaml(retryResponse);
    validationError = tryValidate(yaml, bundle);
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
 * Try to validate a YAML string against a bundle's schema AND enrich function.
 * Schema validation catches structural issues, enrich() catches semantic issues
 * (e.g. commands must be objects with a name field, not plain strings).
 * Returns error message if invalid, undefined if valid.
 */
function tryValidate(yaml: string, bundle: Bundle): string | undefined {
  try {
    const parsed = parseYaml(yaml);
    if (!parsed || typeof parsed !== 'object') {
      return 'Invalid YAML: not an object';
    }

    const envelope = parsed as Record<string, unknown>;
    const spec = envelope.spec;
    if (!spec || typeof spec !== 'object') {
      return 'Missing spec: field in YAML';
    }

    // Schema validation
    validateBody(spec as Record<string, unknown>, bundle.specSchema);

    // Enrich validation — this catches what the schema misses
    const metadata = {
      name: ((envelope.metadata as any)?.name as string) ?? 'draft',
      apiVersion: ((envelope.apiVersion as string) ?? '1.0'),
    };
    bundle.enrich(spec as Record<string, unknown>, metadata);

    return undefined;
  } catch (err) {
    return err instanceof Error ? err.message : 'Validation failed';
  }
}
