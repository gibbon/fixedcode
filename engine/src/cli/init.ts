import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Command } from 'commander';

export function createInitCommand() {
  return new Command('init')
    .description('Scaffold a new spec or bundle')
    .option('-k, --kind <kind>', 'Bundle kind to use (e.g., ddd-domain, crud-api)')
    .option('-n, --name <name>', 'Name for the spec')
    .option('-o, --output <dir>', 'Output directory', '.')
    .action(async (opts) => {
      
      const kind = opts.kind || 'ddd-domain';
      const name = opts.name || 'my-service';
      const output = opts.output;
      
      const specContent = `apiVersion: "1.0"
kind: ${kind}
metadata:
  name: ${name}
  description: "${name} domain"

spec:
  package: com.example.${name.replace(/-/g, '')}
  aggregates: []
`;

      const specPath = join(output || '.', `${name}.yaml`);
      writeFileSync(specPath, specContent, 'utf-8');
      console.log(`Created ${specPath}`);
    });
}