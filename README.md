# setup-flutter-sdk

A GitHub Action that installs and caches the Flutter SDK.

## Usage

### Install the latest stable Flutter release

```yaml
- uses: devoncarew/setup-flutter-sdk@v1
```

### Install the latest beta

```yaml
- uses: devoncarew/setup-flutter-sdk@v1
  with:
    channel: beta
```

### Install a specific version

```yaml
- uses: devoncarew/setup-flutter-sdk@v1
  with:
    version: '3.19.6'
```

### Full workflow example

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: devoncarew/setup-flutter-sdk@v1
      - run: flutter test
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `channel` | No | `stable` | Flutter release channel: `stable`, `beta`, or `main`. Ignored when `version` is set. |
| `version` | No | — | Specific Flutter version, e.g. `3.19.6`. Overrides `channel`. |

## Outputs

| Output | Description |
|--------|-------------|
| `flutter-version` | The fully resolved Flutter version string, e.g. `3.19.6`. |
| `flutter-root` | Absolute path to the Flutter SDK root directory. |

Use outputs with `id`:

```yaml
- uses: devoncarew/setup-flutter-sdk@v1
  id: flutter
- run: echo "Flutter ${{ steps.flutter.outputs.flutter-version }}"
```

## How it works

1. Fetches the Flutter releases manifest from Google Storage.
2. Resolves the requested channel or version to a specific release.
3. Restores the SDK from the GitHub Actions cache if available.
4. On a cache miss, downloads and extracts the SDK, then saves it to cache.
5. Adds `flutter` and `dart` to `PATH` via the SDK's `bin/` directory.

The cache key is `setup-flutter-sdk-linux-<version>`, so cache hits are stable
and deterministic across workflow runs.
