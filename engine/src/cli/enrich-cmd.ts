import { Command } from 'commander';
import { enrich } from '../engine/enrich.js';

export function createEnrichCommand() {
  return new Command('enrich')
    .description('Fill extension point stubs with AI-generated business logic')
    .argument('<outputDir>', 'Generated output directory (contains .fixedcode-manifest.json)')
    .option('--spec <path>', 'Path to the original spec YAML')
    .option('--file <path>', 'Enrich only this specific extension point file (relative to outputDir)')
    .option('--force', 'Skip git safety check (allow enriching uncommitted files)')
    .option('-c, --config <path>', 'Explicit path to .fixedcode.yaml config')
    .option('--provider <provider>', 'LLM provider (openrouter, ollama, openai)')
    .option('--model <model>', 'LLM model name')
    .action(async (outputDir: string, opts) => {
      try {
        const result = await enrich({
          outputDir,
          specFile: opts.spec,
          file: opts.file,
          force: opts.force,
          configPath: opts.config,
          llmOverrides: {
            provider: opts.provider,
            model: opts.model,
          },
        });

        if (result.errors.length > 0) {
          process.exit(1);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Enrich failed: ${message}`);
        process.exit(1);
      }
    });
}
