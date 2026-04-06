import { Command } from 'commander';
import { draft } from '../engine/draft.js';

export function createDraftCommand() {
  return new Command('draft')
    .description('Generate a YAML spec from a natural language description using AI')
    .argument('<kind>', 'Bundle kind (e.g. spring-domain, ts-agent)')
    .argument('<description>', 'Natural language description of the service/agent')
    .option('-o, --output <path>', 'Output file path (default: stdout)')
    .option('-c, --config <path>', 'Explicit path to .fixedcode.yaml config')
    .option('--provider <provider>', 'LLM provider (openrouter, ollama, openai)')
    .option('--model <model>', 'LLM model name')
    .option('--no-retry', 'Disable auto-retry on validation failure')
    .action(async (kind: string, description: string, opts) => {
      try {
        const yaml = await draft({
          kind,
          description,
          output: opts.output,
          retry: opts.retry,
          configPath: opts.config,
          llmOverrides: {
            provider: opts.provider,
            model: opts.model,
          },
        });

        if (!opts.output) {
          process.stdout.write(yaml + '\n');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Draft failed: ${message}`);
        process.exit(1);
      }
    });
}
