# Cutting a release

Internal guide for maintainers.

## Cadence

Pre-1.0 — minor (`0.x`) bumps for any user-visible change; patch (`0.x.y`) for fixes only.

## Process

1. **Update CHANGELOG.md** — flip `[Unreleased]` to a dated section, add an empty new `[Unreleased]`, update compare links at the bottom.
2. **Bump version in `engine/package.json`**.
3. **Commit**: `chore(release): vX.Y.Z`.
4. **Tag**: `git tag vX.Y.Z && git push origin vX.Y.Z`.
5. The push triggers `.github/workflows/release.yml`. It will:
   - Build, typecheck, test, lint.
   - `npm publish ./engine --provenance --access public` using the OIDC trusted-publisher token.
   - Create a GitHub Release with auto-generated notes from the matching CHANGELOG section.
   - Attach the `npm pack` tarball.
6. **Verify on npm**: `npm view @fixedcode/engine@X.Y.Z` and confirm the provenance attestation.
7. **Smoke test from npm** on a clean machine: `npm install -g @fixedcode/engine && fixedcode --version`.

## First-time setup

### npm trusted publisher (preferred — no long-lived tokens)

1. Reserve `@fixedcode` org and `@fixedcode/engine` package name on npmjs.com.
2. On npm package settings → Publishing access → "Add a trusted publisher".
3. Provide:
   - Owner: `gibbon`
   - Repository: `fixedcode`
   - Workflow filename: `release.yml`
   - Environment: (none)
4. The first tag-triggered release will use OIDC; no `NPM_TOKEN` secret needed.

### NPM_TOKEN fallback

If trusted publisher isn't an option:

1. `npm token create --read-only=false`
2. Add as `NPM_TOKEN` in repo secrets.
3. The workflow uses it via `NODE_AUTH_TOKEN`.

## Branch protection on `master`

Apply via the GitHub UI:

- Require a pull request before merging (1 review; relax to 0 for solo maintainer).
- Require status checks: `CI / test (20)`, `CI / test (22)`, `CodeQL`.
- Require branches up-to-date before merging.
- Auto-delete head branches after merge.
- Allow squash-merge only.

## Pre-release checklist

- [ ] `git status` clean on master
- [ ] CI green for the head commit
- [ ] CHANGELOG.md `[Unreleased]` summarises every user-visible change
- [ ] Version bumped in `engine/package.json`
- [ ] `npm pack --dry-run` from `engine/` shows only intended files (no `src/`, no `test/`, no `tsconfig.json`)
- [ ] `SECURITY.md` lists this version as supported
- [ ] No critical/high security findings open
- [ ] `npm audit --audit-level=high` clean across packages
