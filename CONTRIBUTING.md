# Contributing

## Development

```bash
npm install       # install dependencies
npm run build     # compile TypeScript and bundle to dist/index.js
npm run lint      # run ESLint
npm test          # run tests
```

`dist/index.js` must be rebuilt and committed whenever `src/` changes.

## Pull requests

- Work in branches; open a PR against `main`
- Keep each PR focused on a single change
- Do not force-push to an existing PR branch

## Releasing

This action uses two tags per release:

- **`vX.Y.Z`** — pinned to an exact commit (e.g. `v1.0.0`)
- **`vX`** — floating major-version alias (e.g. `v1`), updated on every release

To publish a new release after merging to `main`:

```bash
# Tag the exact version
git tag v1.0.1
git push origin v1.0.1

# Move the floating major-version tag forward
git tag -f v1
git push origin v1 --force
```

Then create a GitHub Release from the new tag:

```bash
gh release create v1.0.1 --title "v1.0.1" --notes "..."
```

Users who pin to `@v1` will automatically get the update; users who pin to
`@v1.0.0` will stay on the previous version until they explicitly update.
