# @fixedcode/bundle-next-marketing-site

Static-export Next.js 14 marketing site skeleton. The public face for any new SaaS vertical — pairs naturally with the `kotlin-spring-bff` (BFF) and `vite-react-app` (product app) skeletons.

## What it generates

A static (`output: 'export'`) Next.js 14 App Router site:

- `app/layout.tsx` with sensible Metadata API defaults driven by `spec.brand`
- `app/page.tsx` — landing page composing `Navbar` + `Hero` + `Footer` (extension point)
- `app/<slug>/page.tsx` — one extension-point page per entry in `spec.pages`
- `components/Navbar.tsx`, `Hero.tsx`, `Footer.tsx` — wired off `spec.brand`, `spec.hero`, `spec.navLinks`, `spec.socialLinks`
- Tailwind v4 (via `@tailwindcss/postcss`) + `next/font` for type
- Build outputs to `out/` — deployable to Cloudflare Pages, Vercel, Netlify, S3, GitHub Pages, etc.
- Optional multi-stage `Dockerfile` (Node 22 → nginx) when `features.docker: true`
- Optional head-only analytics snippet (Plausible / Umami) when `features.analytics != none`

No dynamic API routes, no server actions — strictly static-export friendly. React 18 (matches the rest of the FixedCode frontend stack).

## Spec

```yaml
apiVersion: "1.0"
kind: next-marketing-site
metadata:
  name: jobs-marketing
spec:
  appName: jobs-marketing
  brand:
    name: "FindJobs"
    tagline: "The fastest way to find your next role."
    primaryColor: "#0a0a0a"
  hero:
    headline: "Stop scrolling endless job boards."
    subhead: "Curated roles, shipped weekly."
    ctaText: "Browse jobs"
    ctaHref: "https://app.example.com"
  navLinks:
    - { label: "Pricing", href: "/pricing" }
    - { label: "About", href: "/about" }
  pages:
    - { slug: "about",   title: "About" }
    - { slug: "contact", title: "Contact" }
  socialLinks:
    github: "https://github.com/example/repo"
    twitter: "https://x.com/example"
  recipes: []
  features:
    docker: true
    analytics: none      # none | plausible | umami
```

## Recipes

Recipes are opt-in extras that expand to additional template files behind a `recipes:` flag (same convention as `vite-react-app`).

### Available recipes

#### `pricing-page`

Drops an `app/pricing/page.tsx` Next.js App Router page. Pricing tiers are spec data — add a new vertical's pricing in YAML rather than copy-pasting a component.

```yaml
spec:
  recipes:
    - pricing-page
  pricing:
    headline: "Plans"
    subhead: "Start free, scale as you grow."
    tiers:
      - name: Free
        price: "$0"
        period: "/forever"
        audience: "Solo dev"
        description: "For tinkering."
        features:
          - { text: "CLI" }
          - { text: "Team registry", included: false }
        ctaText: "Install"
        ctaHref: "/install"
      - name: Team
        price: "$99"
        period: "/month"
        audience: "Engineering team"
        highlight: true
        features:
          - { text: "Shared registry" }
        ctaHref: "/trial"
```

Generates:

- `app/pricing/page.tsx` — **extension point** (`overwrite: false`). Tier data is inlined at generation time. Static-export friendly (no client hooks).

Side-effect on `enrich()`: when this recipe is enabled, a `{ label: "Pricing", href: "/pricing" }` entry is auto-appended to `spec.navLinks` if no existing nav link points to `/pricing` (and no link's label already mentions "pricing"). The Footer/Navbar templates are not edited — the link surfaces purely as data flowing into the existing components.

Per-tier fields: `name` (required), `price` (required), `period`, `audience`, `description`, `features: [{ text, included? }]`, `ctaText` (default `"Get started"`), `ctaHref` (default `"#"`), `highlight` (default `false`).

Highlight behaviour: exactly the tiers with `highlight: true` render a "Most popular" badge and an inverted CTA. No new npm deps; uses the same Tailwind tokens as the rest of the bundle.

The landing page (`app/page.tsx`) is intentionally NOT modified by the recipe — keep CTA composition explicit. Add a "see pricing" CTA to `app/page.tsx` yourself (it's an extension point).

### Adding a new recipe

1. Add the recipe name to `schema.json` under `properties.recipes.items.enum`.
2. Drop templates under `templates/recipes/<recipe-name>/`.
3. Append entries to `generateFiles()` behind a `ctx.recipe<Name>` flag.
4. Add a `test/recipes/<recipe-name>.test.ts` with on/off cases.

## Install

```bash
fixedcode registry install next-marketing-site
```

## Notes

- **Static only.** `next.config.mjs` sets `output: 'export'`. No server actions, no dynamic routes — anything that requires a Node runtime won't ship.
- **Brand-driven copy.** The bundle ships zero brand-specific text. Every visible string comes from the spec. Strings interpolated into HTML are HTML-escaped during enrich.
- **Extension points are user-owned.** `app/page.tsx` and every `app/<slug>/page.tsx` are generated once with `overwrite: false`. The `Navbar`, `Hero`, `Footer` plus all build files are regenerated.
- **Why React 18, not 19?** Matches the working stack used by sibling bundles (e.g. `ai-meme-saas`); avoids paying for the React 19 + Next 14 compatibility friction at scaffold time.

## License

[Apache-2.0](../../LICENSE)
