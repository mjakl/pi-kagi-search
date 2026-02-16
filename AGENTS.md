# AGENTS.md

Simple guidance for coding agents working in this repository.

## Repository setup

- Requirements: Node.js + npm
- Install dependencies:

```bash
npm install
```

- Check what would be published:

```bash
npm pack --dry-run
npm publish --dry-run
```

## Local validation

- This package is a Pi extension (entry point: `index.ts`).
- Requires Pi CLI installed and available on `PATH`.
- Quick manual check with local package:

```bash
pi -e .
```

- No automated test/lint scripts are defined yet; validation is currently manual.
- For end-to-end testing of search, set a token first:

```bash
export KAGI_SESSION_TOKEN="your-token"
```

Then run Pi and invoke `kagi_search` (or use `/kagi-login`).

## Code map

- `index.ts` — extension entry point, token management, Kagi result parsing, tool + command registration
- `README.md` — user-facing install/configuration docs
- `CHANGELOG.md` — release history
- `package.json` — package metadata and Pi extension declaration

## Commit format (important)

Prefer the newer style used in recent commits:

- Imperative mood
- Sentence case
- No prefix like `feat:` / `fix:` / `chore:`

Note: older commits in this repo may still use conventional prefixes.

Examples:

- `Add grouped result parsing fallback`
- `Improve token validation message`
- `Clarify Kagi token setup docs`

Keep commits focused (one logical change per commit).

## Release notes

- Package name: `pi-kagi-search`
- For user-visible changes, update `CHANGELOG.md`.
- For npm releases, bump the version (`npm version patch|minor|major`) and publish.
