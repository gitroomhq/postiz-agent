# Contributing

This repo holds the Postiz CLI (published to npm as `postiz`), the `postiz` agent skill and the plugin manifests for Claude Code, Cursor, Grok and Gemini CLI.

## Setup

```bash
pnpm install
pnpm run dev       # watch mode
pnpm run build     # build the CLI into dist/
```

The root `pnpm-lock.yaml` is gitignored, so do not commit it. Run `pnpm run build` before pushing to check the CLI still builds.

Branch off `origin/main` and open the PR against `main`. Commit messages follow the existing history: a type prefix (`feat:`, `fix:`, `docs:`, `ci:`, `chore:`) and, for a version bump, the version, for example `feat: clipping commands (v2.0.19)`.

## Pull request checklist

Before opening a PR, run `git fetch origin` and compare against `origin/main`:

1. **Bump the version** in all of these files, to the same value: `package.json`, `gemini-extension.json`, `.claude-plugin/plugin.json`, `.cursor-plugin/plugin.json` and `.grok-plugin/plugin.json`. Bump the patch (subminor) number by default, and the minor number only for a meaningful change or a refactor. Never bump the major number unless agreed.
2. **Add a `CHANGELOG.md` entry** for the new version, dated, under Added, Changed or Fixed, following the existing entries.
3. **Update the docs the change affects**: `README.md` (commands, API endpoint table, quick reference), `SKILL.md` for commands and agent guidance, `PUBLISHING.md` for release steps, and any GitHub workflow file under `.github/workflows` that the change touches. Do not edit `skills/postiz/SKILL.md` by hand: the `sync-skill` workflow copies the root `SKILL.md` there when a release is published.
4. **Check the version against other open PRs** (`gh pr list`). If one already bumps to the same version, whichever merges second must rebase and take the next version.

If `origin/main` moves after you open the PR (for example another PR merges and bumps the version), merge or rebase `origin/main` into your branch and bump the version again before your PR is merged, so it always ends up higher than `main`'s.

## Changes to the public API

Every change in `postiz-app` that affects the public API should have matching updates in `postiz-docs` and in this repo (CLI command, `README.md` and `SKILL.md`), so customers using Postiz with external agents stay up to date.

## Releasing

If the change needs a new CLI version on npm, create a GitHub release after the PR is merged, following [PUBLISHING.md](PUBLISHING.md). Publishing the release triggers the npm publish. The npm package page shows the `README.md` bundled in the published version, so README and `SKILL.md` changes only reach it through a new release.
