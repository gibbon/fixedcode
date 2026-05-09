# Feature Bundle Roadmap

**Status:** in progress. First recipe shipped — see "Shipped" below. Captured 2026-05-09 from an audit of a sibling production codebase that uses fixedcode-style scaffolding.

## Shipped

| Capability | Released | Where it lives |
|---|---|---|
| `image-upload` (BE) | 0.2.x | `kotlin-spring-bff` recipe — [`bundles/kotlin-spring-bff/templates/recipes/image-upload/`](../bundles/kotlin-spring-bff/templates/recipes/image-upload), wiring in [`src/index.ts`](../bundles/kotlin-spring-bff/src/index.ts), tests in [`test/recipes/image-upload.test.ts`](../bundles/kotlin-spring-bff/test/recipes/image-upload.test.ts). Default storage: local filesystem; `LocalImageService` is an extension point. |
| `image-gallery-upload` (FE) | 0.2.x | `vite-react-app` recipe — [`bundles/vite-react-app/templates/recipes/image-upload/`](../bundles/vite-react-app/templates/recipes/image-upload), wiring in [`src/index.ts`](../bundles/vite-react-app/src/index.ts), tests in [`test/recipes/image-upload.test.ts`](../bundles/vite-react-app/test/recipes/image-upload.test.ts). Drag-and-drop dropzone (extension point) + gallery + typed client; no extra npm deps. |
| `admin-screen` (FE) | 0.2.x | `vite-react-app` recipe — [`bundles/vite-react-app/templates/recipes/admin-screen/`](../bundles/vite-react-app/templates/recipes/admin-screen), wiring in [`src/index.ts`](../bundles/vite-react-app/src/index.ts), enrich in [`src/enrich/recipes/admin-screen.ts`](../bundles/vite-react-app/src/enrich/recipes/admin-screen.ts), tests in [`test/recipes/admin-screen.test.ts`](../bundles/vite-react-app/test/recipes/admin-screen.test.ts). Cross-reads a sibling `spring-domain` spec and emits per-aggregate list/create/edit pages, typed CRUD client, and a sidebar admin layout — wires against the BE endpoints `spring-domain` already produces. |
| `users-management` (BE) | 0.2.x | `kotlin-spring-bff` recipe — [`bundles/kotlin-spring-bff/templates/recipes/users-management/`](../bundles/kotlin-spring-bff/templates/recipes/users-management), wiring in [`src/index.ts`](../bundles/kotlin-spring-bff/src/index.ts), tests in [`test/recipes/users-management.test.ts`](../bundles/kotlin-spring-bff/test/recipes/users-management.test.ts). JWT issuance from email + password (HS256, JJWT), BCrypt hashing, sign-in/up/me + admin users CRUD. Requires `features.database: true`. `JwtService` and `PasswordHasher` are extension points — swap to Clerk / Auth0 / Supabase / Argon2 by replacing the bean. |
| `users-management` (FE) | 0.2.x | `vite-react-app` recipe — [`bundles/vite-react-app/templates/recipes/users-management/`](../bundles/vite-react-app/templates/recipes/users-management), wiring in [`src/index.ts`](../bundles/vite-react-app/src/index.ts), tests in [`test/recipes/users-management.test.ts`](../bundles/vite-react-app/test/recipes/users-management.test.ts). `AuthProvider` + `useAuth` hook, sign-in/up pages (extension points), `RequireAuth` / `RequireRole` guards, native fetch — no new npm deps. When co-enabled with `admin-screen`, admin routes are auto-wrapped in `<RequireRole role="ADMIN">`. |

These were shipped via Composition Approach **C** (recipes inside the skeleton) — no engine changes; `recipes: [...]` is just a new field on each bundle's spec.

The current bundles (`kotlin-spring-bff`, `vite-react-app`, etc.) get you a *skeleton* — an empty Spring service or React SPA. Real applications need *capabilities* on top: image upload, auth flows, search-with-facets, geo-data serving, etc. This doc lists the capabilities surfaced by the audit, ranked by reusability, and proposes how they should compose with the existing skeleton bundles.

## Inventory

### Backend capabilities (pair with `kotlin-spring-bff`)

| Capability | Reusability | Composition | Notes |
|---|---|---|---|
| `image-upload` | High — every vertical | Recipe in skeleton | Thumbnails, WEBP, S3/GCS/local backend. Touches almost every site. |
| `auth-supabase` | High — every vertical | Recipe (BE half) | JwtVerifier + SecurityConfig + Supabase JWKS. Pairs with `vite-react-app` FE half. |
| `pagination-filter-sort` | High — every list endpoint | Built-in to skeleton | Spring Data `Pageable` conventions, `?page&size&sort` query params. |
| `caching-caffeine` | Medium | Already a flag in `kotlin-spring-bff` | Just bump from on/off → policies-per-method. |
| `circuit-breaker-resilience4j` | Medium | Already in `kotlin-spring-bff` per service | |
| `audit-log` | Medium | Recipe | Event publishing on entity change. |
| `background-jobs` | Medium | Recipe | Spring `@Scheduled` + a `JobRunner` skeleton. |
| `geographic-layer-serving` | Medium (location verticals only) | Recipe or its own bundle | PostGIS + ST_Simplify + ST_Intersects + GeoJSON. |
| `pdf-report` | Low | Don't bundle | OpenPDF + per-vertical templates; too bespoke. |
| `payments-stripe` | Low | Don't bundle | Domain-specific. |
| `recommendation-engine` | Low | Don't bundle | Ranking/scoring is the product's IP. |

### Frontend capabilities (pair with `vite-react-app`)

| Capability | Reusability | Composition | Notes |
|---|---|---|---|
| `auth-supabase-ui` | High | Recipe (FE half of `auth-supabase`) | `useAuth` hook, sign-in/up routes, `<RequireAuth>` guard. |
| `form-validation` | High | Recipe | react-hook-form + zod, plus pre-baked input components (TextField, Select, DatePicker). |
| `pagination-list-ui` | High | Recipe | Index-page pattern: query → list → pagination controls. Pairs with backend's `pagination-filter-sort`. |
| `image-gallery-upload` | Medium | Recipe (FE half of `image-upload`) | Drop-zone, progress, gallery view. |
| `faceted-search-ui` | Medium | Recipe | Filter panel + facet drill-down. Pairs with backend's `faceted-search-engine`. |
| `map-view-leaflet` | Medium (location verticals only) | Recipe | Leaflet/MapLibre wrapper, GeoJSON layer, click handlers. |
| `modal-dialog-system` | Medium | Recipe | Headless UI `<Dialog>` wrapper + queue. |

## Composition approaches

The engine currently generates one tree per spec. To compose features into that tree, three options:

### A. Feature flags in the skeleton spec
```yaml
spec:
  features:
    imageUpload: true
    auth: supabase
```
Skeleton author bakes in template branches. No engine changes. Limited to features the skeleton anticipated.

### B. Composable feature bundles
Each feature is a tiny bundle with its own templates. The engine merges trees from multiple bundles into one project.

```yaml
bundles:
  kotlin-spring-bff: ...
  feature-image-upload: ...
  feature-auth-supabase: ...
```

Most flexible, but **needs engine work**: a contribution-merge pipeline that hasn't been built. Gets messy fast (file conflicts, ordering, dependency graph).

### C. Recipes inside the skeleton
Skeleton has an internal registry of named feature recipes. Spec lists which to enable.

```yaml
spec:
  recipes:
    - image-upload
    - auth-supabase
    - faceted-search
```

Each recipe expands to a known set of files in the skeleton's templates. No engine changes. Best for a curated medium-sized set of features per skeleton.

**Recommended path:** Start with **C** (recipes) for the top 3 cross-vertical features. Defer **B** until the recipe registry per skeleton is genuinely getting unwieldy (~10+ features).

## Build order (when you come back to this)

1. `image-upload` (BE) + `image-gallery-upload` (FE) — every vertical needs media. ~1 week.
2. `auth-supabase` (BE+FE pair) — eliminates ~40% of skeleton boilerplate. ~3 days.
3. `form-validation` (FE) — biggest FE time-sink in vertical builds. ~4 days.
4. `pagination-filter-sort` (BE) + `pagination-list-ui` (FE) — every list endpoint. ~2 days.
5. `geographic-layer-serving` (BE) — only if you're building location verticals (jobs, real estate, etc.). ~1 week.
6. `faceted-search-engine` (BE) + `faceted-search-ui` (FE) — couples both halves; useful for ~60% of verticals. ~2 weeks.

## Things to NOT bundle

- PDF report templates, payment provider integrations, recommendation/scoring engines, analytics aggregations — these are domain-specific and belong in extension-point files, not the skeleton.
