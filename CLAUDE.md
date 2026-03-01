# CLAUDE.md — setup-flutter-action

This file provides guidance for AI assistants working in this repository.

## Project Summary

`setup-flutter-action` is a GitHub Action that installs and caches the Flutter SDK.
It is written in TypeScript and compiled to `dist/index.js` for execution.
See `docs/DESIGN.md` for full design rationale and architecture.

## Key Design Principles

- **Simple over clever.** Prefer straightforward code with minimal abstraction.
  This is a small action; it doesn't need a framework.
- **Speed is the primary user-facing goal.** The cache path is the hot path;
  keep it fast and ensure cache keys are stable and deterministic.
- **Minimal inputs.** Resist adding configuration options unless clearly needed.

## Repository Layout

```
src/flutter.ts    # Pure utility functions: manifest types, URL helpers, version resolution
src/index.ts      # Action entry point: fetchManifest, run(), @actions/* integrations
dist/index.js     # Compiled output — regenerate with `npm run build`
action.yml        # Action metadata
```

## Contributing

- Keep CLAUDE.md and docs/DESIGN.md up-to-date as the app design evolves
- The project uses git and is hosted on GitHub
- The project uses GitHub Actions for its CI
- Work should only be done in PRs
- NEVER push directly to the main branch; if you find that you've committed to
  main locally, create a branch for that work and push the branch to a PR
- Keep each PR focused on a single item (for example, documentation updates; a
  bug fix; implementing a specific feature)
- Do not force-push to an existing PR branch — add new commits instead, to
  preserve the review history

## Common Commands

```bash
npm install           # Install dependencies
npm run build         # Compile TypeScript and bundle to dist/index.js
npm run lint          # Run ESLint
npm test              # Run tests (Jest)
```

The `dist/index.js` file is committed to the repository (this is standard
practice for GitHub Actions) and must be rebuilt and re-committed whenever
`src/` changes.

## Build Pipeline

`tsc --noEmit` type-checks the source using `tsconfig.json` (which sets
`moduleResolution: "bundler"` so TypeScript can resolve ESM-only `@actions/*`
packages). Then `esbuild` bundles `src/index.ts` and all its dependencies into
a single `dist/index.js` in CJS format. The `build` script in `package.json`
runs both steps.

A separate `tsconfig.test.json` (CJS mode, `moduleResolution: "node"`) is used
by Jest/ts-jest. Tests only import from `src/flutter.ts`, which has no external
dependencies, so Jest never encounters the ESM-only `@actions/*` packages.

## Action Logic Flow

1. Read inputs (`channel`, `version`) via `@actions/core`.
2. Detect the current OS (`process.platform`) and CPU architecture (`process.arch`).
3. Fetch the OS-specific Flutter releases manifest from Google Storage.
4. Resolve the requested channel/version to a specific version string and
   archive URL using the manifest. On macOS, a second lookup selects the correct
   archive for Apple Silicon (`arm64`) or Intel (`x64`).
5. Compute a cache key: `setup-flutter-<os>[-<arch>]-<resolved-version>`.
6. Attempt cache restore via `@actions/cache`.
7. On cache miss: download the archive and extract it (`.tar.xz` on Linux,
   `.zip` on macOS/Windows).
8. Save to cache (on miss).
9. Add `<sdk-root>/bin` to `PATH` via `core.addPath`.
10. Set outputs: `flutter-version` and `flutter-root`.

## Flutter Releases Manifest

Base URL: `https://storage.googleapis.com/flutter_infra_release/releases/releases_<os>.json`
where `<os>` is `linux`, `macos`, or `windows`.

- `current_release.<channel>` → hash of the latest release on that channel
- `releases[]` → array of all releases; look up by `hash` or `version`
- Each release has: `hash`, `channel`, `version`, `archive` (relative path)
- Archive base URL: `https://storage.googleapis.com/flutter_infra_release/releases/`
- On macOS, two entries exist per version — one for x64 and one for `arm64`
  (identified by `arm64` in the archive filename)

## Error Handling

- If the manifest cannot be fetched, fail the action with a clear message.
- If the requested version is not found in the manifest, fail with a clear
  message listing what was requested.
- Prefer `core.setFailed(message)` over throwing for top-level errors.

## Testing

- Unit tests cover: manifest parsing, version resolution logic, cache key
  generation.
- A smoke test workflow (`.github/workflows/smoke.yml`) runs the action itself
  on a real runner to verify end-to-end behavior.
- Tests do not make real network requests; mock the HTTP client.

## What's Out of Scope (for now)

- Pub cache caching (tracked in issue #14)
- Any inputs beyond `channel` and `version`
