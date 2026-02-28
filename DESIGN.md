# setup-flutter-sdk Design

## Overview

`devoncarew/setup-flutter-sdk` is a GitHub Action that installs the Flutter SDK
into a workflow environment. It is optimized for fast startup — particularly on
repeated runs — by caching the SDK transparently via `actions/cache`.

The action is authored in TypeScript and compiled to a single `dist/index.js`
for execution, following the standard GitHub Actions pattern.

## Goals

- **Simple**: minimal configuration surface, easy to understand and maintain.
- **Fast**: cache the SDK automatically so short workflows pay the download cost
  only once per SDK version.
- **Correct**: resolve "latest stable/beta" to a specific version before
  caching, so cache keys are stable and deterministic.

## Inputs

| Input     | Required | Default    | Description |
|-----------|----------|------------|-------------|
| `channel` | No       | `"stable"` | Flutter release channel: `stable`, `beta`, or `main`. |
| `version` | No       | —          | Specific Flutter version, e.g. `3.19.6`. When provided, `channel` is ignored. |

At least one of `channel` or `version` must produce a resolvable SDK. If both
are omitted, the action defaults to the latest `stable` release.

**Future (not in v1):** support partial versions like `3.19`, resolving to the
latest patch release in that minor series.

## Outputs

| Output           | Description |
|------------------|-------------|
| `flutter-version` | The fully resolved Flutter version string, e.g. `3.19.6`. |
| `flutter-root`    | Absolute path to the Flutter SDK root directory. |

`flutter` and `dart` are both added to `PATH` via Flutter's `bin/` directory.

## Release Resolution

Flutter publishes a releases manifest per platform at:

```
https://storage.googleapis.com/flutter_infra_release/releases/releases_linux.json
```

The manifest structure is:

```json
{
  "current_release": {
    "stable": "<hash>",
    "beta": "<hash>",
    "main": "<hash>"
  },
  "releases": [
    {
      "hash": "...",
      "channel": "stable",
      "version": "3.19.6",
      "archive": "stable/linux/flutter_linux_3.19.6-stable.tar.xz",
      ...
    }
  ]
}
```

**Resolution algorithm:**

1. Fetch the releases manifest for the current OS.
2. If `version` is specified, find the release entry whose `version` field
   matches exactly.
3. If `channel` is specified (or defaulted), use `current_release[channel]` to
   get the hash of the latest release on that channel, then look up that hash in
   the `releases` array to get the version string and archive URL.
4. The resolved version string becomes the cache key.

The archive URL from the manifest is used directly for downloads, avoiding any
URL construction guesswork.

## Caching

Caching is handled transparently using `@actions/cache`. Users do not need to
add a separate cache step.

**Cache key:** `setup-flutter-sdk-<os>-<resolved-version>`

Example: `setup-flutter-sdk-linux-3.19.6`

**Cache path:** the directory containing the extracted Flutter SDK
(e.g. `$RUNNER_TOOL_CACHE/flutter/<version>/`).

On a cache hit, the action skips the download and extract steps entirely and
proceeds directly to adding the SDK to PATH and setting outputs. On a cache
miss, the action downloads, extracts, caches, and then proceeds.

No warning or annotation is emitted on a cache miss — this is intentional to
keep logs clean.

## Download & Extraction

Archives are downloaded from `storage.googleapis.com` using the URL provided
directly in the releases manifest.

Flutter provides archives in both `.zip` and `.tar.xz` format. The action will
use whichever format provides the best balance of download size and extraction
speed for each platform (to be determined by benchmarking during implementation;
initial Linux implementation will use `.tar.xz`).

Extraction is handled by `@actions/tool-cache` utilities (`extractZip` /
`extractTar`).

## Platform Support

**v1:** Linux only (`ubuntu-*` runners).

**Future:** macOS and Windows support, using platform-appropriate archive
formats and path handling.

## Implementation Language & Build

- **Language:** TypeScript
- **Runtime:** Node.js 20 (per `action.yml` `using: node20`)
- **Entry point:** `dist/index.js` (compiled from `src/index.ts`)
- **Build:** `tsc` + `ncc` to bundle into a single file with dependencies
- **Key dependencies:**
  - `@actions/core` — inputs, outputs, PATH manipulation, logging
  - `@actions/cache` — transparent SDK caching
  - `@actions/tool-cache` — download and extract utilities
  - `@actions/http-client` — fetching the releases manifest

## Repository Structure

```
setup-flutter-sdk/
├── action.yml          # Action metadata (inputs, outputs, entry point)
├── src/
│   └── index.ts        # Main action logic
├── dist/
│   └── index.js        # Compiled + bundled output (committed to repo)
├── .github/
│   └── workflows/
│       ├── ci.yml      # Build, lint, test on PRs
│       └── smoke.yml   # End-to-end test: run the action itself
├── package.json
├── tsconfig.json
├── DESIGN.md
└── README.md
```

## action.yml

```yaml
name: 'Setup Flutter SDK'
description: 'Install and cache the Flutter SDK'
inputs:
  channel:
    description: 'Flutter release channel (stable, beta, main)'
    required: false
    default: 'stable'
  version:
    description: 'Specific Flutter version (e.g. 3.19.6); overrides channel'
    required: false
runs:
  using: node20
  main: dist/index.js
outputs:
  flutter-version:
    description: 'The resolved Flutter SDK version'
  flutter-root:
    description: 'Path to the Flutter SDK root directory'
```
