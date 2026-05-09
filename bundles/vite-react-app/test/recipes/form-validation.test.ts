import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Handlebars from 'handlebars';
import { enrich, generateFiles, helpers } from '../../src/index.js';

const meta = { name: 'demo', apiVersion: '1.0' };

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = join(__dirname, '..', '..', 'templates');

const FORM_VALIDATION_OUTPUTS = [
  'src/lib/forms/useZodForm.ts',
  'src/lib/forms/getFieldError.ts',
  'src/components/forms/Form.tsx',
  'src/components/forms/FieldError.tsx',
  'src/components/forms/TextField.tsx',
  'src/components/forms/NumberField.tsx',
  'src/components/forms/Select.tsx',
  'src/components/forms/DatePicker.tsx',
];

function renderTemplate(templatePath: string, ctx: Record<string, unknown>): string {
  const hbs = Handlebars.create();
  for (const [name, fn] of Object.entries(helpers)) {
    hbs.registerHelper(name, fn as Handlebars.HelperDelegate);
  }
  const src = readFileSync(join(TEMPLATE_DIR, templatePath), 'utf-8');
  return hbs.compile(src, { noEscape: true })(ctx);
}

describe('vite-react-app form-validation recipe', () => {
  it('does not generate any form files when recipe is disabled', () => {
    const ctx = enrich({ appName: 'plain-app' }, meta);
    expect(ctx.recipeFormValidation).toBe(false);
    expect(ctx.dependencies['react-hook-form']).toBeUndefined();
    expect(ctx.dependencies['zod']).toBeUndefined();
    expect(ctx.dependencies['@hookform/resolvers']).toBeUndefined();

    const outputs = generateFiles(ctx).map((f) => f.output);
    for (const out of FORM_VALIDATION_OUTPUTS) {
      expect(outputs).not.toContain(out);
    }
  });

  it('generates all form files and adds the validation deps when enabled', () => {
    const ctx = enrich(
      { appName: 'forms-app', recipes: ['form-validation'] },
      meta,
    );
    expect(ctx.recipeFormValidation).toBe(true);

    expect(ctx.dependencies['react-hook-form']).toMatch(/^\^7/);
    expect(ctx.dependencies['zod']).toMatch(/^\^3/);
    expect(ctx.dependencies['@hookform/resolvers']).toMatch(/^\^3/);

    const files = generateFiles(ctx);
    const outputs = files.map((f) => f.output);
    for (const out of FORM_VALIDATION_OUTPUTS) {
      expect(outputs, `missing ${out}`).toContain(out);
    }

    // The hook + types are framework plumbing (overwritable). The components
    // are extension points users style and tweak.
    const hook = files.find((f) => f.output.endsWith('useZodForm.ts'));
    expect(hook?.overwrite).not.toBe(false);
    for (const componentFile of [
      'Form.tsx',
      'FieldError.tsx',
      'TextField.tsx',
      'NumberField.tsx',
      'Select.tsx',
      'DatePicker.tsx',
    ]) {
      const f = files.find((x) => x.output.endsWith(componentFile));
      expect(f?.overwrite, `${componentFile} should be an extension point`).toBe(false);
    }
  });

  it('useZodForm wires the zodResolver and defaults to onBlur validation', () => {
    const rendered = renderTemplate(
      'recipes/form-validation/src/lib/forms/useZodForm.ts.hbs',
      {} as Record<string, unknown>,
    );
    expect(rendered).toContain("import { zodResolver } from '@hookform/resolvers/zod'");
    expect(rendered).toContain('resolver: zodResolver(schema)');
    expect(rendered).toMatch(/mode:\s*options\.mode\s*\?\?\s*'onBlur'/);
    // Generic over a Zod schema; consumers don't pass an explicit type arg.
    expect(rendered).toContain('export function useZodForm<S extends ZodTypeAny>');
  });

  it('NumberField registers with setValueAs so empty input → undefined (not NaN)', () => {
    const rendered = renderTemplate(
      'recipes/form-validation/src/components/forms/NumberField.tsx.hbs',
      {} as Record<string, unknown>,
    );
    expect(rendered).toContain('setValueAs:');
    // Empty string maps to undefined so z.number().optional() works without
    // tripping over "Expected number, received nan".
    expect(rendered).toContain("v === ''");
    expect(rendered).toContain('Number(v)');
    expect(rendered).toContain('type="number"');
  });

  it('Select placeholder is selectable (not disabled) — required-ness comes from Zod', () => {
    const rendered = renderTemplate(
      'recipes/form-validation/src/components/forms/Select.tsx.hbs',
      {} as Record<string, unknown>,
    );
    // Old behaviour: <option value="" disabled>. New: just <option value="">.
    expect(rendered).toMatch(/<option value="">\{placeholder\}<\/option>/);
    expect(rendered).not.toMatch(/<option value="" disabled>/);
  });

  it('field components use getFieldError + fieldId for nested-path support', () => {
    for (const file of [
      'TextField.tsx.hbs',
      'NumberField.tsx.hbs',
      'Select.tsx.hbs',
      'DatePicker.tsx.hbs',
    ]) {
      const rendered = renderTemplate(
        `recipes/form-validation/src/components/forms/${file}`,
        {} as Record<string, unknown>,
      );
      expect(rendered, file).toContain('getFieldError(form.formState.errors, name)');
      expect(rendered, file).toContain('fieldId(name)');
      expect(rendered, file).not.toContain('as never');
    }
  });

  it('getFieldError walks dotted paths and returns leaf FieldErrors only', () => {
    const rendered = renderTemplate(
      'recipes/form-validation/src/lib/forms/getFieldError.ts.hbs',
      {} as Record<string, unknown>,
    );
    expect(rendered).toContain("name.split('.')");
    // Leaf detection: only return when the cursor object has `type` (RHF FieldError shape).
    expect(rendered).toContain("'type' in cursor");
    // fieldId sanitises dots so admin.role → admin-role.
    expect(rendered).toContain("name.replace(/\\./g, '-')");
  });

  it('TextField/Select/DatePicker emit aria-invalid + aria-describedby for accessibility', () => {
    for (const file of ['TextField.tsx.hbs', 'Select.tsx.hbs', 'DatePicker.tsx.hbs']) {
      const rendered = renderTemplate(
        `recipes/form-validation/src/components/forms/${file}`,
        {} as Record<string, unknown>,
      );
      expect(rendered, file).toContain('aria-invalid={error ? true : undefined}');
      expect(rendered, file).toContain('aria-describedby=');
    }
  });

  it('Form wrapper renders rootError above field-level errors when provided', () => {
    const rendered = renderTemplate(
      'recipes/form-validation/src/components/forms/Form.tsx.hbs',
      {} as Record<string, unknown>,
    );
    expect(rendered).toContain('role="alert"');
    expect(rendered).toContain('form.handleSubmit(onSubmit)');
    // The form is `noValidate` so HTML5 validation doesn't double up with Zod.
    expect(rendered).toContain('noValidate');
  });

  it('Select supports an optional placeholder option with empty value', () => {
    const rendered = renderTemplate(
      'recipes/form-validation/src/components/forms/Select.tsx.hbs',
      {} as Record<string, unknown>,
    );
    expect(rendered).toMatch(/placeholder \? <option value="">\{placeholder\}<\/option>/);
  });

  it('composes with admin-screen + pagination-list-ui', () => {
    const ctx = enrich(
      {
        appName: 'forms-app',
        features: { api: true },
        recipes: ['form-validation', 'pagination-list-ui'],
      },
      meta,
    );
    expect(ctx.recipeFormValidation).toBe(true);
    expect(ctx.recipePaginationListUi).toBe(true);
    expect(ctx.dependencies['react-hook-form']).toBeDefined();
    expect(ctx.dependencies['zod']).toBeDefined();
  });
});
