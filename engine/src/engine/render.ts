import Handlebars from 'handlebars';
import { readFileSync, statSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Context, RenderedFile } from '../types.js';
import { RenderError } from '../errors.js';

export interface TemplateOptions {
  noEscape?: boolean;
  helpers?: Record<string, (...args: unknown[]) => unknown>;
  partials?: Record<string, string>;
}

export async function renderTemplates(
  templatesDir: string,
  context: Context,
  options: TemplateOptions = {}
): Promise<RenderedFile[]> {
  const hb = Handlebars.create();

  if (options.helpers) {
    for (const [name, fn] of Object.entries(options.helpers)) {
      hb.registerHelper(name, fn);
    }
  }

  if (options.partials) {
    for (const [name, source] of Object.entries(options.partials)) {
      hb.registerPartial(name, source);
    }
  }

  return renderDirectory(hb, templatesDir, '', context, '');
}

/**
 * Render a single Handlebars template file to a string.
 * Used by the generateFiles pipeline branch.
 *
 * @param absTemplatePath - Absolute path to the .hbs file
 * @param ctx - Context for rendering
 * @param options - Handlebars options (helpers, partials)
 */
export function renderFile(
  absTemplatePath: string,
  ctx: Record<string, unknown>,
  options: TemplateOptions = {}
): string {
  const hb = Handlebars.create();

  if (options.helpers) {
    for (const [name, fn] of Object.entries(options.helpers)) {
      hb.registerHelper(name, fn);
    }
  }
  if (options.partials) {
    for (const [name, source] of Object.entries(options.partials)) {
      hb.registerPartial(name, source);
    }
  }

  try {
    const content = readFileSync(absTemplatePath, 'utf-8');
    return hb.compile(content, { noEscape: options.noEscape })(ctx);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    throw new RenderError(absTemplatePath, msg);
  }
}

function renderDirectory(
  hb: typeof Handlebars,
  baseDir: string,
  relDir: string,
  context: Context,
  outputRelDir: string
): RenderedFile[] {
  const results: RenderedFile[] = [];
  const fullDir = join(baseDir, relDir);
  
  if (!existsSync(fullDir)) return results;
  
  const entries = readdirSync(fullDir);
  
  for (const rawEntry of entries) {
    const entry = rawEntry.replace(/\n/g, '').trim();
    if (!entry) continue;
    
    const entryPath = join(fullDir, entry);
    const stat = statSync(entryPath);

    if (stat.isDirectory()) {
      // Handle {{#each}} iteration directories
      if (entry.startsWith('{{#each ') && entry.includes('}}')) {
        const match = entry.match(/\{\{#each\s+(\w+)\}\}(.*)/);
        if (match) {
          const key = match[1];
          const items = context[key];
          
          if (!Array.isArray(items)) {
            throw new RenderError(join(relDir, entry), `'${key}' is not an array in context`);
          }

          for (const item of items) {
            const itemContext = { ...context, ...item };
            let innerDir = entry.replace(/\{\{#each\s+\w+\}\}/, '').trim();
            if (innerDir) {
              try {
                innerDir = hb.compile(innerDir)(itemContext);
              } catch {
                innerDir = item.names?.pascal || item.name || key;
              }
            } else {
              innerDir = item.names?.pascal || item.name || key;
            }
            
            const templateReadDir = join(relDir, entry);
            const outputWriteDir = outputRelDir ? join(outputRelDir, innerDir) : innerDir;
            
            const innerResults = renderDirectory(hb, baseDir, templateReadDir, itemContext, outputWriteDir);
            results.push(...innerResults);
          }
        }
      } else if (entry.includes('{{') && entry.includes('}}')) {
        // Handle simple variable substitution in directory names like {{ .VariableName }}
        try {
          const renderedDir = hb.compile(entry)(context);
          const cleanDir = renderedDir.replace(/\n/g, '').trim();
          if (cleanDir && cleanDir !== entry) {
            const innerResults = renderDirectory(hb, baseDir, join(relDir, entry), context, outputRelDir ? join(outputRelDir, cleanDir) : cleanDir);
            results.push(...innerResults);
          }
        } catch {
          // Skip directories that fail to render
        }
      } else {
        const innerResults = renderDirectory(hb, baseDir, join(relDir, entry), context, outputRelDir ? join(outputRelDir, entry) : entry);
        results.push(...innerResults);
      }
    } else if (stat.isFile()) {
      const templateFilePath = join(relDir, entry);
      const result = renderTemplateFile(hb, baseDir, templateFilePath, context);
      if (result) {
        let outputPath: string;
        if (outputRelDir) {
          const outFileName = entry.replace(/\.hbs$/, '');
          try {
            outputPath = hb.compile(join(outputRelDir, outFileName))(context);
          } catch {
            outputPath = join(outputRelDir, outFileName);
          }
        } else {
          outputPath = result.path;
        }
        results.push({ path: outputPath, content: result.content });
      }
    }
  }

  return results;
}

function renderTemplateFile(
  hb: typeof Handlebars,
  baseDir: string,
  relPath: string,
  context: Context
): RenderedFile | null {
  if (!relPath.endsWith('.hbs')) {
    return null;
  }
  
  const fullPath = join(baseDir, relPath);
  
  try {
    const content = readFileSync(fullPath, 'utf-8');
    const template = hb.compile(content);
    const rendered = template(context);
    
    if (rendered.trim() === '') {
      return null;
    }
    
    let outPath = relPath.replace(/\.hbs$/, '');
    try {
      outPath = hb.compile(outPath)(context);
    } catch {
      // keep original
    }

    if (!outPath || outPath.includes('..')) {
      throw new RenderError(relPath, 'Invalid output path');
    }

    return { path: outPath, content: rendered };
  } catch (err) {
    if (err instanceof RenderError) throw err;
    const msg = err instanceof Error ? err.message : 'Unknown error';
    throw new RenderError(relPath, msg);
  }
}