import { Command } from 'commander';
import {
  fetchRegistry,
  searchRegistry,
  listRegistry,
  installPackage,
  publishPackage,
} from '../engine/registry.js';

export function createRegistryCommand() {
  const registry = new Command('registry')
    .alias('reg')
    .description('Browse and install bundles and generators from the registry');

  registry
    .command('search <query>')
    .description('Search the registry for bundles and generators')
    .option('-u, --url <url>', 'Registry URL override')
    .action(async (query: string, opts) => {
      try {
        const reg = await fetchRegistry(opts.url);
        const results = searchRegistry(reg, query);

        if (results.length === 0) {
          console.log(`No packages found matching "${query}"`);
          return;
        }

        console.log(`Found ${results.length} package(s):\n`);
        for (const pkg of results) {
          console.log(`  ${pkg.name}@${pkg.version} (${pkg.kind})`);
          console.log(`    ${pkg.description}`);
          console.log(`    Tags: ${pkg.tags.join(', ')}`);
          console.log();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Registry search failed: ${message}`);
        process.exit(1);
      }
    });

  registry
    .command('list')
    .description('List all available packages')
    .option('-k, --kind <kind>', 'Filter by kind (bundle, generator)')
    .option('-u, --url <url>', 'Registry URL override')
    .action(async (opts) => {
      try {
        const reg = await fetchRegistry(opts.url);
        const results = listRegistry(reg, opts.kind);

        console.log(`${results.length} package(s) available:\n`);
        for (const pkg of results) {
          console.log(`  ${pkg.name}@${pkg.version} (${pkg.kind})`);
          console.log(`    ${pkg.description}`);
          console.log();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Registry list failed: ${message}`);
        process.exit(1);
      }
    });

  registry
    .command('install <name>')
    .description('Install a package from the registry')
    .option('-u, --url <url>', 'Registry URL override')
    .action(async (name: string, opts) => {
      try {
        const reg = await fetchRegistry(opts.url);
        const pkg = reg.packages.find((p) => p.name === name || p.name.endsWith(`/${name}`));

        if (!pkg) {
          console.error(`Package "${name}" not found in registry`);
          process.exit(1);
        }

        const result = installPackage(pkg, process.cwd());
        console.log(`\nInstalled ${result.package}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Install failed: ${message}`);
        process.exit(1);
      }
    });

  registry
    .command('publish')
    .description('Publish current directory as a bundle/generator to the registry (opens a PR)')
    .option('-k, --kind <kind>', 'Package kind: bundle or generator', 'bundle')
    .option('-t, --tags <tags>', 'Comma-separated tags', '')
    .option('-d, --dir <dir>', 'Package directory (default: current directory)')
    .action(async (opts) => {
      try {
        const tags = opts.tags ? opts.tags.split(',').map((t: string) => t.trim()) : [];
        const dir = opts.dir ?? process.cwd();

        console.log('Publishing to fixedcode registry...\n');
        const prUrl = await publishPackage({
          packageDir: dir,
          kind: opts.kind,
          tags,
        });

        console.log(`\nPull request created: ${prUrl}`);
        console.log('Once merged, the package will be available via `fixedcode registry search`');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Publish failed: ${message}`);
        process.exit(1);
      }
    });

  return registry;
}
