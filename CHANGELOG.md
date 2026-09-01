# Changelog

All notable changes to the Postiz CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.17] - 2026-09-01

### Added
- Grok Build plugin support: `.grok-plugin/plugin.json` and `.grok-plugin/marketplace.json` (validated with xAI's `validate-catalog.py`). The Grok manifest also declares the hosted Postiz MCP server (`https://mcp.postiz.com/mcp-oauth-dynamic`, OAuth on first connect) via its `mcpServers` field. The Claude Code and Cursor plugins stay skill/CLI-only — there is intentionally no root `.mcp.json`, so installing those plugins never registers a second Postiz MCP server next to an existing connector.

## [2.0.16] - 2026-09-01

### Added
- Cursor plugin support: `.cursor-plugin/plugin.json` and `.cursor-plugin/marketplace.json` so the repo installs as a [Cursor plugin](https://cursor.com/docs/reference/plugins) alongside the existing Claude Code plugin. `skills/postiz/SKILL.md` is now a real file instead of a symlink, regenerated from the root `SKILL.md` by a GitHub Action on every published release (or `pnpm sync-skill` locally).
- `posts:settings` - Update a post's provider settings via `PUT /public/v1/posts/:id/settings` (merged — only the keys you pass change; unpublished DRAFT/QUEUE posts only).

### Changed
- `posts:list` responses now include each post's current `settings`.

## [1.0.0] - 2026-02-13

### Added
- Initial release of Postiz CLI
- `posts:create` - Create new social media posts
- `posts:list` - List all posts with pagination and search
- `posts:delete` - Delete posts by ID
- `integrations:list` - List connected social media integrations
- `upload` - Upload media files (images)
- Environment variable configuration (POSTIZ_API_KEY, POSTIZ_API_URL)
- Comprehensive help documentation
- Example scripts for basic usage and AI agent integration
- SKILL.md for AI agent usage patterns

### Features
- Command-line interface for Postiz API
- Support for scheduled posts
- Multi-platform posting via integrations
- Media upload functionality
- User-friendly error messages with emojis
- JSON output for programmatic parsing
- Comprehensive examples for AI agents
