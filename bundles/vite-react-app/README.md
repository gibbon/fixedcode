# @fixedcode/bundle-vite-react-app

Vite + React 19 + TypeScript SPA skeleton.

## Install

```bash
fixedcode registry install vite-react-app
```

## What it generates

A complete frontend project: `package.json`, `vite.config.ts`, project-references `tsconfig`, ESLint flat config, optional Tailwind v4, optional TanStack Router (code-based), optional typed `fetch` wrapper, optional Supabase client, optional multi-stage Docker + nginx, plus one extension-point file per route in `src/routes/`.

## Spec highlights

```yaml
apiVersion: "1.0"
kind: vite-react-app
metadata:
  name: my-app
spec:
  appName: my-app
  port: 5173
  routes:
    - { path: /, name: Home }
    - { path: /about, name: About }
  features:
    router: tanstack       # tanstack | reactrouter | none
    api: true
    apiBaseUrl: http://localhost:8080
    auth: none             # supabase | clerk | none
    docker: false
    tailwind: true
```

## Notes

- TanStack Router is wired with **code-based routing** (a single `src/router.tsx`). The file-based routing setup (router-vite-plugin codegen + `routeTree.gen.ts`) is intentionally avoided so the generated project type-checks the moment it lands. If you prefer file-based routing, swap to it after generation.
- React Router v7 ships its own typegen these days; this bundle currently only wires the TanStack Router code path. `reactrouter` adds the dep but does not generate a router scaffold yet — TODO.
- Route files (`src/routes/*.tsx`) are extension points (`overwrite: false`). They are generated once, then user-owned.

## License

[Apache-2.0](../../LICENSE)
