# fixedcode.ai

Marketing site for [FixedCode](https://github.com/gibbon/fixedcode). Built with Next.js 14 and Tailwind. Deploys to Cloudflare Pages.

## Develop

```bash
cd website
npm install
npm run dev
```

Open <http://localhost:3000>.

## Build

```bash
npm run build
```

Static output is emitted to `out/` (Next.js App Router with `output: 'export'`).

## Deploy

Cloudflare Pages reads from `master`. The deploy hooks live in Cloudflare's dashboard, not in this repo. Local Wrangler state in `.wrangler/` is gitignored.

**Required env (local development only):**

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Put them in `website/.env.local` (gitignored). **Never commit this file.** The repo's `.gitignore` excludes `.env*.local` at every level.

## Structure

- `app/` — Next.js App Router pages
- `components/` — page sections (Hero, Bundles, AISandwich, Footer, etc.)
- `tailwind.config.ts`, `postcss.config.mjs` — styling

## License

[Apache-2.0](../LICENSE) — same as the rest of the repo.
