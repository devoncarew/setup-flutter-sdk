# Setup Flutter SDK

A GitHub action that installs the Flutter SDK.

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

      - run: flutter pub get
      - run: flutter analyze
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

1. Detects the current OS and CPU architecture.
2. Fetches the Flutter releases manifest for the current OS from Google Storage.
3. Resolves the requested channel or version to a specific release (on macOS, selects the correct archive for Apple Silicon or Intel).
4. Restores the SDK from the GitHub Actions cache if available.
5. On a cache miss, downloads and extracts the SDK (`.tar.xz` on Linux, `.zip` on macOS/Windows), then saves it to cache.
6. Adds `flutter` and `dart` to `PATH` via the SDK's `bin/` directory.
7. Sets `PUB_CACHE` to `~/.pub-cache` and adds `~/.pub-cache/bin` to `PATH`.

Cache keys are stable and deterministic across workflow runs:

| Platform | Cache key |
|----------|-----------|
| Linux | `setup-flutter-sdk-linux-<version>` |
| macOS (Apple Silicon) | `setup-flutter-sdk-macos-arm64-<version>` |
| macOS (Intel) | `setup-flutter-sdk-macos-x64-<version>` |
| Windows | `setup-flutter-sdk-windows-<version>` |

Setting `PUB_CACHE` explicitly ensures a consistent pub cache location across
all steps. Adding `~/.pub-cache/bin` to `PATH` makes globally-activated Dart
tools (e.g. `dart pub global activate`) available without extra configuration.
