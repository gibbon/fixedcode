import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Command } from 'commander';

const SAAS_VERTICAL_NAME_PATTERN = /^[a-z][a-z0-9-]*$/;

/**
 * Validate a saas-vertical project name.
 *
 * Rules: kebab-case starting with a letter — same shape as the bundle init
 * validator and the same shape every bundle's `appName` field expects.
 *
 * @throws Error if the name is invalid.
 */
export function validateSaasVerticalName(name: string): string {
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error(`Invalid saas-vertical name: empty`);
  }
  if (!SAAS_VERTICAL_NAME_PATTERN.test(name)) {
    throw new Error(
      `Invalid saas-vertical name: ${JSON.stringify(name)} — must match ${SAAS_VERTICAL_NAME_PATTERN}`,
    );
  }
  return name;
}

function toPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .filter((s) => s.length > 0)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

function toFlatName(kebab: string): string {
  return kebab.replace(/-/g, '');
}

interface SaasVerticalScaffold {
  name: string;
  brandName: string;
  flatName: string;
  packageName: string;
}

export function buildSaasVerticalScaffold(name: string): {
  scaffold: SaasVerticalScaffold;
  files: { path: string; content: string }[];
} {
  validateSaasVerticalName(name);
  const brandName = toPascalCase(name);
  const flatName = toFlatName(name);
  const packageName = `com.example.${flatName}`;

  const scaffold: SaasVerticalScaffold = { name, brandName, flatName, packageName };

  const fixedcodeYaml = `# .fixedcode.yaml
# Bundles are referenced by registry name. If you're running this inside the
# fixedcode monorepo, replace each value with the local file path
# (e.g. './bundles/spring-domain') so the engine resolves the local source
# instead of the (yet-to-be-published) npm package.
bundles:
  spring-domain: '@fixedcode/bundle-spring-domain'
  kotlin-spring-bff: '@fixedcode/bundle-kotlin-spring-bff'
  vite-react-app: '@fixedcode/bundle-vite-react-app'
  next-marketing-site: '@fixedcode/bundle-next-marketing-site'

generators:
  openapi: '@fixedcode/generator-openapi'
`;

  const domainSpec = `apiVersion: '1.0'
kind: spring-domain
metadata:
  name: ${name}-domain

spec:
  boundedContext: ${brandName}
  service:
    port: 8082
    package: ${packageName}

  aggregates:
    Job:
      attributes:
        jobId: uuid
        title: string
        description: string
        status: string = JobStatus
        location?: string
        salary?: int
        remote: boolean = false
        postedAt: instant

      commands:
        - name: CreateJob
          body: [title, description, location?, salary?, remote?]
          emits: JobCreated
        - name: UpdateJob
          body: [title?, description?, location?, salary?]
          emits: JobUpdated
        - name: PublishJob
          body: [status]
          emits: JobPublished
        - name: DeleteJob
          emits: JobDeleted

      queries:
        - name: GetJob
          returns: Job
        - name: SearchJob
          returns: PagedJobList
        - name: FindJobsByStatus
          query: [status]
          returns: JobList

      events:
        JobCreated:
          fields: [jobId, title, status]
        JobUpdated:
          fields: [jobId]
        JobPublished:
          fields: [jobId, status]
        JobDeleted:
          fields: [jobId]

      enumDefaults:
        JobStatus: [DRAFT, PUBLISHED, CLOSED]

      entities:
        Application:
          attributes:
            applicationId: uuid
            jobId: uuid
            applicantName: string
            applicantEmail: string
            status: string = ApplicationStatus
            score?: double
            appliedAt: instant

          commands:
            - name: SubmitApplication
              body: [applicantName, applicantEmail]
              emits: ApplicationSubmitted
            - name: ReviewApplication
              body: [status, score?]
              emits: ApplicationReviewed
            - name: WithdrawApplication
              emits: ApplicationWithdrawn

          queries:
            - name: SearchApplication
              returns: PagedApplicationList

          events:
            ApplicationSubmitted:
              fields: [jobId, applicationId, applicantEmail]
            ApplicationReviewed:
              fields: [jobId, applicationId, status]
            ApplicationWithdrawn:
              fields: [jobId, applicationId]

          enumDefaults:
            ApplicationStatus: [SUBMITTED, REVIEWED, ACCEPTED, REJECTED]
`;

  const bffSpec = `apiVersion: '1.0'
kind: kotlin-spring-bff
metadata:
  name: ${name}-bff

spec:
  appName: ${name}-bff
  groupId: com.example
  port: 8080
  javaVersion: 21
  features:
    auth: jwt
    database: true
    docker: true
  recipes:
    - users-management
    - image-upload
    - pagination-filter-sort
  usersManagement:
    tokenTtlMinutes: 1440
    defaultAdminEmail: admin@example.com
  services:
    - name: ${name}-domain
      baseUrl: http://${name}-domain:8082
`;

  const appSpec = `apiVersion: '1.0'
kind: vite-react-app
metadata:
  name: ${name}-app

spec:
  appName: ${name}-app
  features:
    router: tanstack
    api: true
    apiBaseUrl: http://localhost:8080
    auth: none
    tailwind: true
  recipes:
    - admin-screen
    - users-management
    - dashboard
    - image-upload
  usersManagement:
    signInPath: /sign-in
    signUpPath: /sign-up
    afterSignInPath: /
  imageUpload:
    apiPath: /images
  adminScreen:
    domainSpec: specs/${name}-domain.yaml
    basePath: /admin
    apiBaseUrl: http://localhost:8080
  dashboard:
    title: ${brandName} Dashboard
    timeRanges: ['7d', '30d', '90d']
    stats:
      - name: Active Jobs
        endpoint: /api/stats/active-jobs
        format: number
      - name: Applications
        endpoint: /api/stats/applications
        format: number
      - name: Conversion Rate
        endpoint: /api/stats/conversion
        format: percent
`;

  const marketingSpec = `apiVersion: '1.0'
kind: next-marketing-site
metadata:
  name: ${name}-marketing

spec:
  appName: ${name}-marketing
  brand:
    name: ${brandName}
    tagline: Sign up to find your next role.
    primaryColor: '#0a0a0a'
  hero:
    headline: Build your ${name} faster.
    subhead: An opinionated starter that ships the boring parts so you can focus on what makes your product different.
    ctaText: Get started
    ctaHref: /sign-up
  navLinks:
    - label: Features
      href: /#features
    - label: Pricing
      href: /pricing
  pages:
    - slug: about
      title: About
      description: Learn more about ${brandName}.
  recipes:
    - pricing-page
  pricing:
    headline: Simple pricing
    subhead: Start free, upgrade when you grow.
    tiers:
      - name: Starter
        price: '$0'
        period: /month
        audience: Indie hackers and side projects
        description: Everything you need to validate an idea.
        features:
          - text: Up to 3 listings
          - text: Community support
          - text: Branded URL
            included: false
        ctaText: Start free
        ctaHref: /sign-up
      - name: Pro
        price: '$29'
        period: /month
        audience: Growing teams
        description: For teams shipping serious volume.
        highlight: true
        features:
          - text: Unlimited listings
          - text: Priority support
          - text: Custom domain
        ctaText: Start trial
        ctaHref: /sign-up?plan=pro
      - name: Enterprise
        price: Custom
        audience: Large organisations
        description: Volume pricing, SSO, and a dedicated CSM.
        features:
          - text: SSO / SAML
          - text: Dedicated success manager
          - text: Custom SLA
        ctaText: Contact sales
        ctaHref: /contact
  features:
    docker: false
    analytics: none
`;

  const readme = `# ${brandName}

Generated by \`fixedcode init saas-vertical ${name}\`.

This project bundles four specs that together describe a full SaaS vertical:

| Spec | What it generates |
|---|---|
| \`specs/${name}-domain.yaml\` | Spring Boot domain service (DDD aggregates, REST endpoints, migrations). |
| \`specs/${name}-bff.yaml\` | Kotlin / Spring BFF that fronts the domain service, with JWT auth, image upload, and users-management. |
| \`specs/${name}-app.yaml\` | Vite + React product app with admin screens, users-management, dashboard, and image upload. |
| \`specs/${name}-marketing.yaml\` | Next.js static-export marketing site with a pricing page. |

## Next steps

\`\`\`bash
cd ${name}

# 1. Wire up bundles. Either:
#    a) edit .fixedcode.yaml and replace each '@fixedcode/bundle-*' with a
#       local file path if you're working inside the fixedcode monorepo, OR
#    b) install the bundles from the registry (when published):
#       fixedcode registry install spring-domain
#       fixedcode registry install kotlin-spring-bff
#       fixedcode registry install vite-react-app
#       fixedcode registry install next-marketing-site

# 2. Build all four specs into ./build
fixedcode build specs/ -o build

# 3. (Optional) deploy the generated trees into separate sibling projects
fixedcode deploy build/${name}-domain   ../${name}-domain
fixedcode deploy build/${name}-bff      ../${name}-bff
fixedcode deploy build/${name}-app      ../${name}-app
fixedcode deploy build/${name}-marketing ../${name}-marketing
\`\`\`

## Customising

- Swap the sample \`Job\` / \`Application\` aggregates in \`specs/${name}-domain.yaml\` for your real domain.
- Edit pricing tiers in \`specs/${name}-marketing.yaml\`.
- Add or remove recipes from each spec — see the spec schemas for available options.
- Each generated tree has its own \`.fixedcode-manifest.json\`; extension-point files are user-owned and survive regeneration.
`;

  const files = [
    { path: '.fixedcode.yaml', content: fixedcodeYaml },
    { path: 'specs/' + name + '-domain.yaml', content: domainSpec },
    { path: 'specs/' + name + '-bff.yaml', content: bffSpec },
    { path: 'specs/' + name + '-app.yaml', content: appSpec },
    { path: 'specs/' + name + '-marketing.yaml', content: marketingSpec },
    { path: 'README.md', content: readme },
  ];

  return { scaffold, files };
}

function createSpecInitCommand(): Command {
  return new Command('spec')
    .description('Scaffold a single spec file (default sub-command)')
    .option('-k, --kind <kind>', 'Bundle kind to use (e.g., ddd-domain, crud-api)')
    .option('-n, --name <name>', 'Name for the spec')
    .option('-o, --output <dir>', 'Output directory', '.')
    .action((opts) => writeSingleSpec(opts));
}

function writeSingleSpec(opts: { kind?: string; name?: string; output?: string }) {
  const kind = opts.kind || 'ddd-domain';
  const name = opts.name || 'my-service';
  const output = opts.output || '.';

  const specContent = `apiVersion: "1.0"
kind: ${kind}
metadata:
  name: ${name}
  description: "${name} domain"

spec:
  package: com.example.${name.replace(/-/g, '')}
  aggregates: []
`;

  const specPath = join(output, `${name}.yaml`);
  writeFileSync(specPath, specContent, 'utf-8');
  console.log(`Created ${specPath}`);
}

function createSaasVerticalCommand(): Command {
  return new Command('saas-vertical')
    .description('Scaffold a multi-spec SaaS starter (domain + BFF + app + marketing)')
    .argument('<name>', 'Vertical name in kebab-case (e.g. jobs)')
    .option('-o, --output <dir>', 'Parent directory in which to create the project', '.')
    .action((name: string, opts: { output?: string }) => {
      validateSaasVerticalName(name);

      const targetDir = join(opts.output || '.', name);
      if (existsSync(targetDir)) {
        console.error(`Error: Directory ${targetDir} already exists`);
        process.exit(1);
      }

      const { files } = buildSaasVerticalScaffold(name);

      mkdirSync(targetDir, { recursive: true });
      mkdirSync(join(targetDir, 'specs'), { recursive: true });

      for (const file of files) {
        writeFileSync(join(targetDir, file.path), file.content, 'utf-8');
      }

      console.log(`Created SaaS vertical scaffold at ${targetDir}`);
      for (const file of files) {
        console.log(`  - ${file.path}`);
      }
      console.log('');
      console.log('Next steps:');
      console.log(`  cd ${name}`);
      console.log(
        '  # Edit .fixedcode.yaml — point each bundle at a local path or installed package',
      );
      console.log('  fixedcode build specs/ -o build');
    });
}

export function createInitCommand() {
  const init = new Command('init').description('Scaffold a new spec, bundle, or SaaS vertical');

  // Sub-commands
  init.addCommand(createSpecInitCommand(), { isDefault: true });
  init.addCommand(createSaasVerticalCommand());

  return init;
}
