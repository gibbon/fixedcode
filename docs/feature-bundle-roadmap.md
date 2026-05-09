# Feature Bundle Roadmap

**Status:** SaaS-vertical core complete. 11 capabilities + 1 new skeleton + 1 CLI preset shipped in 0.2.x. Remaining items below are optional next-tier features. Last updated 2026-05-09.

## Pick this up in a new session

Start here. The "What's left" table below is the single source of truth for what to build next. Each row is a self-contained piece of work. Pick one, follow the pattern of the most recent shipped sibling, ship.

The composition rules and audit context are at the bottom of this doc for reference, but you don't need to re-read them — the patterns are baked into the existing recipes.

## What's left

| # | Item | Type | Pairs with | Effort | Why it matters |
|---|---|---|---|---|---|
| 1 | `background-jobs` (BE) | recipe | `kotlin-spring-bff` | ~1 day | Spring `@Scheduled` + a `JobRunner` interface (extension point). Provides retry, idempotency-key, and graceful-shutdown wrappers. |
| 2 | `charts` (FE) | recipe | `vite-react-app` | ~1 day | Wires Recharts (or Tremor — pick one) into the `dashboard` recipe's empty charts slot. Spec lists chart types per stat. |
| 3 | `modal-dialog-system` (FE) | recipe | `vite-react-app` | ~half day | Native `<dialog>` wrapper + open/close queue + focus trap. Used everywhere in admin flows. |
| 4 | `geographic-layer-serving` (BE) | recipe | `kotlin-spring-bff` | ~1 week | PostGIS + ST_Simplify + ST_Intersects + GeoJSON endpoints with caching. Only needed for location verticals (real estate, jobs-by-location, schools). |
| 5 | `map-view-leaflet` (FE) | recipe | `vite-react-app` | ~3 days | Leaflet/MapLibre wrapper with GeoJSON layer + click handlers. Pairs with `geographic-layer-serving`. |
| 6 | `faceted-search-engine` (BE) | recipe | `kotlin-spring-bff` | ~1 week | Spring Data JPA query builder + facet aggregation. |
| 7 | `faceted-search-ui` (FE) | recipe | `vite-react-app` | ~3 days | Filter panel + facet drill-down. Pairs with `faceted-search-engine`. |
| 8 | `blog` (FE) | recipe | `next-marketing-site` | ~1 day | MDX-based blog under `/blog/[slug]`. Front-matter for title/date/author. |
| 9 | `cta-banner` (FE) | recipe | `next-marketing-site` | ~half day | Site-wide CTA bar with optional dismiss. |

### How to pick one

- **For admin polish:** row 2 (charts) — turns the existing dashboard from placeholders into something you'd ship. Or row 3 (modals) — every admin flow needs confirm/edit dialogs.
- **For ops:** row 1 (background-jobs).
- **For a location vertical:** rows 4–5 (geo + map).
- **For a search-heavy vertical:** rows 6–7 (faceted search).

### Pattern to follow

Each new recipe follows the convention already established in the shipped recipes:

1. Add `<recipe-name>` to the `recipes` enum in the bundle's `schema.json`.
2. Add a recipe-config block to the schema if needed (e.g. `pagination: { defaultPageSize: 20 }`).
3. Add types + normaliser in `src/enrich/spec.ts`.
4. Create `src/enrich/recipes/<recipe-name>.ts` with the context builder.
5. Add `templates/recipes/<recipe-name>/` with the file tree to emit.
6. Wire it into `generateFiles()` in `src/index.ts`.
7. Mark per-aggregate / user-customisable files as `overwrite: false` (extension points).
8. Add `test/recipes/<recipe-name>.test.ts` with at least: disabled, enabled, composition (if applicable).
9. Update the bundle README + this doc's Shipped table.

The clearest reference is the most recent shipped recipe in the same bundle:
- BE pattern: `bundles/kotlin-spring-bff/templates/recipes/users-management/`
- FE pattern: `bundles/vite-react-app/src/enrich/recipes/dashboard.ts` + `templates/recipes/dashboard/`

## Shipped

| Capability | Released | Where it lives |
|---|---|---|
| `image-upload` (BE) | 0.2.x | `kotlin-spring-bff` recipe — local FS + `LocalImageService` extension point. |
| `image-gallery-upload` (FE) | 0.2.x | `vite-react-app` recipe — drop-zone + gallery + typed client; no extra deps. |
| `admin-screen` (FE) | 0.2.x | `vite-react-app` recipe — cross-reads a sibling `spring-domain` spec; per-aggregate list/create/edit pages + sidebar admin layout. |
| `users-management` (BE) | 0.2.x | `kotlin-spring-bff` recipe — JWT issuance, BCrypt hashing, sign-in/up/me + admin users CRUD. `JwtService` + `PasswordHasher` are extension points. |
| `users-management` (FE) | 0.2.x | `vite-react-app` recipe — `AuthProvider` + `useAuth` + `RequireAuth`/`RequireRole`. Auto-wraps admin routes when both `users-management` and `admin-screen` are enabled. |
| `next-marketing-site` (skeleton) | 0.2.x | New skeleton bundle — static-export Next.js 14, brand-driven Hero/Navbar/Footer, configurable extension-point pages, optional analytics, optional Docker → nginx. |
| `pricing-page` (FE × 2) | 0.2.x | Same recipe shape in both `vite-react-app` and `next-marketing-site`. Spec-driven tiers (`name/price/period/features/highlight`). |
| `dashboard` (FE) | 0.2.x | `vite-react-app` recipe — spec-driven stat tiles + time-range selector. Composes with `admin-screen` (Dashboard appears as first sidebar link). No charting library yet. |
| `pagination-filter-sort` (BE) | 0.2.x | `kotlin-spring-bff` recipe — `?page&size&sort&filter` convention via `PageRequest` + `PageRequestArgumentResolver`. Standalone (no JPA dep). `PageResponse<T>` wire format. |
| `pagination-list-ui` (FE) | 0.2.x | `vite-react-app` recipe — `usePagedList<T>` hook + `Pagination` + `SortHeader` components. TS types mirror the BE wire format exactly. Local state, no router coupling. Requires `features.api: true`. |
| `form-validation` (FE) | 0.2.x | `vite-react-app` recipe — `useZodForm` + `Form` wrapper + `TextField`, `NumberField`, `Select`, `DatePicker`, `FieldError`. Adds `react-hook-form` + `zod` + `@hookform/resolvers`. Type-inferred values, accessible inline errors. |
| `audit-log` (BE) | 0.2.x | `kotlin-spring-bff` recipe — `AuditLogPublisher.created/updated/deleted()` facade fires Spring events; listener writes to `audit_log` table (V100 migration) + forwards to `AuditLogOutboundAdapter` (extension point) for Kafka/SQS. SecurityConfig auto-locks `/api/audit-log/**` to `ROLE_ADMIN` when paired with `users-management`. |
| `saas-vertical` preset (CLI) | 0.2.x | `fixedcode init saas-vertical <name>` — scaffolds 4 specs (domain + BFF + app + marketing) with all the above recipes pre-wired. |

All shipped via Composition Approach **C** — recipes inside the skeleton, no engine changes.

---

## Reference: composition approaches

The engine generates one tree per spec. Three options for composing features into that tree:

**A. Feature flags in the skeleton spec** — `features: { imageUpload: true }`. Skeleton bakes in template branches. Easy, but skeleton must know every feature ahead of time.

**B. Composable feature bundles** — each feature is its own bundle; engine merges trees. Most flexible. **Needs engine work** that hasn't been done. Defer until C is genuinely unwieldy.

**C. Recipes inside the skeleton** — skeleton has internal registry of named recipes; spec lists which to enable. **What we use today.** No engine changes. Best for a medium-sized set of features per skeleton (~10 each is fine).

## Reference: things to NOT bundle

- PDF report templates, payment provider integrations, recommendation/scoring engines, analytics aggregations — domain-specific. Belong in extension-point files, not the skeleton.

## Reference: original audit context

This roadmap came out of a sibling-codebase audit (`~/projects/socials/ai-meme-saas`, the codebase behind `searchschools.com.au`). The audit identified recurring patterns across 4 backends and 2 frontends. The Shipped column above closes the universal "every vertical needs this" cases. The "What's left" section is the long tail.
