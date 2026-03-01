# Implementation Plan — setup-flutter-action

## Milestone 1 — Scaffold ✓

- Initialize the repo: `package.json`, `tsconfig.json`, `.gitignore`, `action.yml`
- Install deps: `@actions/core`, `@actions/cache`, `@actions/tool-cache`,
  `@actions/http-client`, `@vercel/ncc`, `typescript`, `jest`, `eslint`
- Write a minimal `src/index.ts` that reads inputs and logs them, build it,
  confirm `dist/index.js` is produced
- Add `.github/workflows/ci.yml` that runs `npm run build && npm test` on PRs

## Milestone 2 — Release Resolution ✓

- Write the manifest-fetching and version-resolution logic
- Unit tests covering: channel resolution, exact version lookup,
  version-not-found error
- No download yet; just confirm the resolved version and archive URL are correct

## Milestone 3 — Download & Extract (no cache) ✓

- On cache miss, download the archive URL and extract it using `tool-cache`
- Add `bin/` to PATH, set outputs
- Add a smoke test workflow that runs the action on an `ubuntu-latest` runner
  and verifies `flutter --version` works
- Benchmark `.tar.xz` vs `.zip` extraction time on GitHub-hosted runners to
  confirm the best archive format for Linux

## Milestone 4 — Caching ✓

- Wrap the download/extract with `@actions/cache` restore + save
- Verify in the smoke test that a second run is a cache hit (check action logs)
- Benchmark: compare cold vs warm run times

## Milestone 5 — Polish & Release ✓

- Write `README.md` with usage examples
- Add input validation with clear error messages
- Publish to GitHub Marketplace as v1

## Milestone 6 — Pub cache ✓

- Use an explicit, fixed location for the pub cache
- Export the pub cache bin's directory to the system path
- For now, do not use caching (`@actions/cache`) for the pub cache

## Milestone 7 — macOS & Windows ✓

- Add platform detection; use `.zip` on Windows, `.tar.xz` on Linux/macOS
- Update the releases manifest URL per OS (`releases_macos.json`,
  `releases_windows.json`)
- Update smoke test matrix to include all three platforms

## Milestone 8 — Partial Version Matching ✓

- Accept versions like `3.19` and resolve to the latest `3.19.x` in the
  manifest
- Update input docs and tests
