## 1.0.0

Initial release:

- Installs the Flutter SDK.
- Accepts `channel` or `version` input.
- `channel` can be one of `stable`, `beta`, or `main` (defaulting to `stable`).
- `version` can be an exact match (e.g. `3.19.6`) or a version prefix (e.g.
  `3.19`). A version prefix resolves to the latest patch version of that
  series.
- Exposes `flutter-version` and `flutter-root` outputs.
- Adds `flutter`, `dart`, and `~/.pub-cache/bin` to the `PATH`.
- Caches the SDK so subsequent runs restore from cache instead of re-downloading.
- Supports Linux, macOS, and Windows.
- On macOS, performs architecture detection for `arm64` vs`x64`.
