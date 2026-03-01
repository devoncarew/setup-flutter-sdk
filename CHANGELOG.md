## 1.0.0

Initial release:

- Installs the Flutter SDK.
- Accepts `channel` or `version` input.
- Channel can be one of `stable`, `beta`, or `main`, defaulting to `stable`.
- Version can be an exact macth (e.g. `3.19.6`) or a version prefix (e.g.
  `3.19.6`). A version prefix resolves to the latest patch version of that
  series.
- Exposes `flutter-version` and `flutter-root` outputs.
- Adds `flutter` and `dart` to the `PATH` as well as `~/.pub-cache/bin`.
- Caches the SDK so subsequent runs restore from cache instead of
  re-downloading.
- Supports Linuc, macOS, and Windows.
- On macOS, performs architecture detection for `arm64` vs`x64`.
