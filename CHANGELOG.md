## 1.1.0

- Added macOS support, including automatic architecture detection for Apple Silicon (`arm64`) and Intel (`x64`).
- Added Windows support.
- The `version` input now accepts a version prefix such as `3.19`, which resolves to the latest `3.19.x` release in the manifest.
- `PUB_CACHE` is now set to `~/.pub-cache` and `~/.pub-cache/bin` is added to `PATH`, making globally-activated Dart tools available in subsequent steps.

## 1.0.0

Initial release. Features:

- Installs the Flutter SDK on Linux (`ubuntu-latest`) runners.
- Accepts a `channel` input (`stable`, `beta`, or `main`; default: `stable`) or an exact `version` input (e.g. `3.19.6`).
- Caches the SDK using `@actions/cache` with a deterministic key, so subsequent runs restore from cache instead of re-downloading.
- Adds `flutter` and `dart` to `PATH` via the SDK's `bin/` directory.
- Exposes `flutter-version` and `flutter-root` outputs.
