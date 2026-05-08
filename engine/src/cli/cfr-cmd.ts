import { Command } from 'commander';
import { CFR_CATALOG, generateCfrReport, suggestCfrs, verifyCfrs } from '../engine/cfr.js';
import { loadConfig } from '../engine/config.js';
import { resolveBundle } from '../engine/resolve.js';
import { parseSpec, validateEnvelope } from '../engine/parse.js';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';

export function createCfrCommand() {
  const cfr = new Command('cfr').description(
    'Cross-Functional Requirements — view, verify, and report on CFR compliance',
  );

  cfr
    .command('catalog')
    .description('List all known CFRs that bundles can implement')
    .option(
      '-c, --category <category>',
      'Filter by category (security, observability, resilience, data, events, testing, devops)',
    )
    .action((opts) => {
      const categories = [...new Set(CFR_CATALOG.map((c) => c.category))];

      for (const category of categories) {
        if (opts.category && category !== opts.category) continue;
        console.log(`\n${category.toUpperCase()}`);
        const cfrs = CFR_CATALOG.filter((c) => c.category === category);
        for (const cfr of cfrs) {
          console.log(`  ${cfr.id.padEnd(20)} ${cfr.name}`);
          console.log(`  ${''.padEnd(20)} ${cfr.description}`);
        }
      }
    });

  cfr
    .command('check <specPath> <outputDir>')
    .description('Verify CFR compliance for a generated service')
    .action(async (specPath: string, outputDir: string) => {
      try {
        const specDir = resolve(specPath, '..');
        const config = loadConfig(specDir);
        const rawSpec = parseSpec(specPath);
        validateEnvelope(rawSpec);
        const bundle = await resolveBundle(rawSpec.kind, config);

        if (!bundle.cfrs) {
          console.log(`Bundle '${rawSpec.kind}' does not declare CFR metadata.`);
          console.log('Add a cfrs field to the bundle export to enable CFR tracking.');
          return;
        }

        const specCfrs = (rawSpec.spec as any).cfrs;
        const result = verifyCfrs(bundle.cfrs, specCfrs, resolve(outputDir));

        console.log(`\nCFR Compliance: ${result.passed ? 'PASSED' : 'FAILED'}\n`);
        for (const cfr of result.cfrs) {
          const status = !cfr.enabled ? 'DISABLED' : cfr.present ? 'PASS' : 'MISSING';
          const icon = status === 'PASS' ? '+' : status === 'DISABLED' ? '-' : 'X';
          console.log(`  [${icon}] ${cfr.name} — ${status}`);
          for (const f of cfr.missingFiles) {
            console.log(`      Missing: ${f}`);
          }
        }

        if (!result.passed) process.exit(1);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`CFR check failed: ${message}`);
        process.exit(1);
      }
    });

  cfr
    .command('report <specPath> <outputDir>')
    .description('Generate a CFR compliance report (Markdown)')
    .option('-o, --output <file>', 'Write report to file (default: stdout)')
    .action(async (specPath: string, outputDir: string, opts) => {
      try {
        const specDir = resolve(specPath, '..');
        const config = loadConfig(specDir);
        const rawSpec = parseSpec(specPath);
        validateEnvelope(rawSpec);
        const bundle = await resolveBundle(rawSpec.kind, config);

        if (!bundle.cfrs) {
          console.error(`Bundle '${rawSpec.kind}' does not declare CFR metadata.`);
          process.exit(1);
        }

        const specCfrs = (rawSpec.spec as any).cfrs;
        const report = generateCfrReport(bundle.cfrs, specCfrs, resolve(outputDir));

        if (opts.output) {
          writeFileSync(opts.output, report, 'utf-8');
          console.log(`Report written to ${opts.output}`);
        } else {
          console.log(report);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`CFR report failed: ${message}`);
        process.exit(1);
      }
    });

  cfr
    .command('suggest <specPath>')
    .description('Suggest CFRs not yet covered by the bundle')
    .action(async (specPath: string) => {
      try {
        const specDir = resolve(specPath, '..');
        const config = loadConfig(specDir);
        const rawSpec = parseSpec(specPath);
        validateEnvelope(rawSpec);
        const bundle = await resolveBundle(rawSpec.kind, config);

        if (!bundle.cfrs) {
          console.log('Bundle has no CFR metadata. All CFRs are suggestions:\n');
          for (const cfr of CFR_CATALOG) {
            console.log(`  ${cfr.id.padEnd(20)} ${cfr.name} (${cfr.category})`);
            console.log(`  ${''.padEnd(20)} ${cfr.description}`);
          }
          return;
        }

        const suggestions = suggestCfrs(bundle.cfrs);
        if (suggestions.length === 0) {
          console.log('This bundle covers all known CFRs!');
          return;
        }

        console.log(`\n${suggestions.length} CFRs not yet covered by this bundle:\n`);
        for (const cfr of suggestions) {
          console.log(`  ${cfr.id.padEnd(20)} ${cfr.name} (${cfr.category})`);
          console.log(`  ${''.padEnd(20)} ${cfr.description}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`CFR suggest failed: ${message}`);
        process.exit(1);
      }
    });

  return cfr;
}
