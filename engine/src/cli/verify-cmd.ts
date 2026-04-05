import { Command } from 'commander';
import { verify } from '../engine/verify.js';

export function createVerifyCommand() {
  return new Command('verify')
    .alias('vfy')
    .description('Verify that all expected files from a spec were generated')
    .argument('<specPath>', 'Path to the domain spec YAML')
    .argument('<outputDir>', 'Build output directory to check')
    .action((specPath: string, outputDir: string) => {
      try {
        const result = verify({ specPath, outputDir });

        console.log(`\nVerification: ${result.passed ? 'PASSED' : 'FAILED'}`);
        console.log(`  Checked: ${result.total} files`);
        console.log(`  Found: ${result.total - result.missing.length}`);

        if (result.missing.length > 0) {
          console.log(`  Missing: ${result.missing.length}`);
          for (const file of result.missing) {
            console.log(`    - ${file}`);
          }
          process.exit(1);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Verify failed: ${message}`);
        process.exit(1);
      }
    });
}
