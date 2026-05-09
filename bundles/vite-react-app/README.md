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

## Recipes

A **recipe** is a named feature that the spec opts into. Each recipe expands to a fixed set of additional files inside the generated tree (no engine changes needed — recipes are entirely a bundle concern).

```yaml
spec:
  appName: media-spa
  recipes:
    - image-upload
  imageUpload:
    apiPath: /images
```

Recipe templates live under `templates/recipes/<recipe-name>/` and are wired into `generateFiles()` behind `ctx.recipe<Name>` flags.

### Available recipes

#### `image-upload`

The frontend half of the `image-upload` capability — pairs with the `kotlin-spring-bff` recipe of the same name (or any backend exposing the same shape). Uses native `fetch` + `FormData` + `XMLHttpRequest` (for upload progress) + the `<dialog>` element — no extra npm deps.

Generates:

- `src/types/image.ts` — `ImageDto` and `ImageVariant` types matching the BE
- `src/lib/images.ts` — `uploadImage(file, opts?)`, `deleteImage(id)`, `getImageUrl(id, variant?)`. Reads `import.meta.env.VITE_API_BASE_URL` and the configured `apiPath` (default `/images`)
- `src/components/ImageUpload.tsx` — **extension point** (`overwrite: false`) — drag-and-drop dropzone with progress indicator. Accepts `onUploaded(image)` callback
- `src/components/ImageGallery.tsx` — grid of thumbnails with click-to-lightbox. Takes `images: ImageDto[]` and optional `onDelete`

Spec config (under `spec.imageUpload`):

| Field     | Default    | Description                                                  |
| --------- | ---------- | ------------------------------------------------------------ |
| `apiPath` | `/images`  | Path under `VITE_API_BASE_URL` where the BE endpoints live   |

#### `admin-screen`

Cross-reads a sibling `spring-domain` spec and emits a full admin CRUD UI per aggregate, wired against the BE endpoints `spring-domain` already exposes (`GET/POST/PUT/DELETE /api/{kebab-plural}`).

```yaml
spec:
  appName: admin-app
  recipes:
    - admin-screen
  adminScreen:
    domainSpec: ./jobs-domain.yaml   # path resolved relative to process.cwd()
    basePath: /admin                 # default
    apiBaseUrl: ''                   # falls back to VITE_<APP>_API_BASE_URL
```

For each aggregate in the domain spec it generates:

| File                                     | Overwrite | Purpose                                         |
| ---------------------------------------- | --------- | ----------------------------------------------- |
| `src/admin/<Plural>/types.ts`            | yes       | `<Aggregate>` and `<Aggregate>Input` interfaces |
| `src/admin/<Plural>/<Agg>Client.ts`      | yes       | Typed CRUD client (fetch + JSON, no deps)       |
| `src/admin/<Plural>/<Plural>ListPage.tsx`| yes       | Paginated table + search box                    |
| `src/admin/<Plural>/<Agg>CreatePage.tsx` | **no**    | Extension point — wire to your router           |
| `src/admin/<Plural>/<Agg>EditPage.tsx`   | **no**    | Extension point — wire to your router           |
| `src/admin/<Plural>/<Agg>Form.tsx`       | **no**    | Extension point — own the field rendering       |

Plus once-only:

| File                       | Overwrite | Purpose                                              |
| -------------------------- | --------- | ---------------------------------------------------- |
| `src/admin/AdminLayout.tsx`| **no**    | Extension point — sidebar shell, link per aggregate  |
| `src/admin/index.ts`       | yes       | Router-agnostic `adminRoutes: AdminRoute[]` table    |

##### Field-type mapping

`spring-domain` field types map to FE form input types:

| spring-domain type       | FE input type    | TS type   |
| ------------------------ | ---------------- | --------- |
| `string`                 | `text`           | `string`  |
| `int` / `long` / `double`| `number`         | `number`  |
| `boolean`                | `checkbox`       | `boolean` |
| `localDate` / `date`     | `date`           | `string`  |
| `instant` / `date-time`  | `datetime-local` | `string`  |
| `uuid` (1st)             | readonly `text`  | `string`  |
| `string = EnumName`      | `select`         | `string`  |

The enum `select` is wired automatically when a `string = X` default matches a key in the aggregate's `enumDefaults`.

##### Route registration

The recipe ships a router-agnostic `adminRoutes: { path, Component }[]` array in `src/admin/index.ts`. Wire it into your router yourself — TanStack and React Router register routes too differently to safely auto-edit `src/router.tsx`. Snippets are inlined in the generated `src/admin/index.ts` header comment.

The Create/Edit pages navigate via `window.location.assign(...)` so they work without any router wiring out of the box; swap to your router's `navigate()` once you've registered the routes.

##### `cwd` resolution caveat

`adminScreen.domainSpec` is resolved relative to `process.cwd()` (the directory you invoke `fixedcode` from), **not** relative to the spec file. The engine's `SpecMetadata` doesn't currently carry a spec path. For deterministic builds, either:

- Run `fixedcode generate ...` from the directory containing both specs, or
- Use an absolute path: `domainSpec: /abs/path/to/domain.yaml`.

If you bundle your project with `fixedcode build <dir>`, both specs already live under `<dir>` — set `domainSpec: ./your-domain.yaml` and run `fixedcode build` from the project root.

### Adding a new recipe

1. Add the recipe name to `schema.json` under `properties.recipes.items.enum` and `KNOWN_RECIPES` in `src/enrich/spec.ts`.
2. Add a `recipe<Name>: boolean` flag to the enriched context.
3. Drop templates under `templates/recipes/<recipe-name>/` and append them to `generateFiles()` behind the new flag.
4. Add a `test/recipes/<recipe-name>.test.ts` with on/off cases.

## License

[Apache-2.0](../../LICENSE)
