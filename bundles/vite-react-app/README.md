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

### Adding a new recipe

1. Add the recipe name to `schema.json` under `properties.recipes.items.enum` and `KNOWN_RECIPES` in `src/enrich/spec.ts`.
2. Add a `recipe<Name>: boolean` flag to the enriched context.
3. Drop templates under `templates/recipes/<recipe-name>/` and append them to `generateFiles()` behind the new flag.
4. Add a `test/recipes/<recipe-name>.test.ts` with on/off cases.

## License

[Apache-2.0](../../LICENSE)
