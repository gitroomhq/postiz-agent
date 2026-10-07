# dsh-postiz

[![npm](https://img.shields.io/npm/v/dsh-postiz)](https://www.npmjs.com/package/dsh-postiz)

**npm:** [`dsh-postiz`](https://www.npmjs.com/package/dsh-postiz) ·
**source:** [gitroomhq/postiz-agent](https://github.com/gitroomhq/postiz-agent/tree/main/plugins/dsh-postiz)

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) plugin for
[Postiz](https://postiz.com), the open-source social media scheduler. It connects the agent
to the Postiz MCP server so it can list your connected channels, fetch each platform's
posting rules, and schedule, draft, or publish posts across 28+ platforms (X, LinkedIn,
Instagram, Facebook, Threads, TikTok, YouTube, Reddit, Pinterest, Bluesky, Mastodon,
Discord, Slack, Telegram, and more).

## Install

From the repository:

```bash
dsh plugin --profile web add "github:gitroomhq/postiz-agent#path:/plugins/dsh-postiz"
```

Or from npm:

```bash
dsh plugin --profile web add dsh-postiz
```

Then give it a Postiz API key. Copy it from **Postiz → Settings → Developers → Public API**
and export it before starting dsh, or put it in `$DSH_HOME/.env`:

```bash
export POSTIZ_API_KEY=your-api-key
dsh web
```

Restart the profile after installing. Ask the agent *"List my connected social media
accounts"* to verify the connection.

## What you get

The bundle mounts two rows:

| Row | Package | Role |
|---|---|---|
| `postiz` | `dsh-postiz` (this package) | Reads the API key, exposes `ctx.postiz` (`url`, `headers`), and registers the `postiz` skill that teaches the agent the posting workflow and the HTML content rules. |
| `postiz-mcp` | `@deepseek-ai/dsh-mcp-client` (shipped with dsh) | Connects to `https://mcp.postiz.com/mcp` over streamable HTTP with a `Bearer` header and registers the server's tools. |

The model sees the Postiz MCP tools under the `mcp__postiz__` namespace:

| Tool | What it does |
|---|---|
| `mcp__postiz__integrationList` | List connected channels (optionally filtered by group) |
| `mcp__postiz__groupList` | List customer groups |
| `mcp__postiz__integrationSchema` | Posting rules, character limits, and required settings for a platform |
| `mcp__postiz__triggerTool` | Platform helpers (list Discord channels, search subreddits, list LinkedIn pages) |
| `mcp__postiz__schedulePostTool` | Schedule, draft, or immediately publish posts |
| `mcp__postiz__postsListTool` | List posts scheduled between two dates |
| `mcp__postiz__postSettingsTool` | Update settings of an unpublished post |
| `mcp__postiz__generateImageTool` | Generate an image for a post |
| `mcp__postiz__generateVideoOptions` / `videoFunctionTool` / `generateVideoTool` | Video generation options and generation |

The tool list comes from the server at connect time, so new Postiz tools appear without a
plugin update. See the [Postiz MCP tools reference](https://docs.postiz.com/mcp/tools).

## Configuration

Override the `postiz` row in your profile's `cordis.patch.yml` (`$DSH_HOME/profiles/web/cordis.patch.yml`).
A bare `id:` configures the existing row:

```yaml
- id: postiz
  config:
    apiKeyEnv: POSTIZ_API_KEY          # env var that holds the key (default)
    baseUrl: https://mcp.postiz.com    # self-hosted: https://your-postiz-server.com
    skill: true                        # register the `postiz` workflow skill
```

| Field | Default | Description |
|---|---|---|
| `apiKeyEnv` | `POSTIZ_API_KEY` | Environment variable read at boot for the API key. |
| `apiKey` | `''` | Inline key. Prefer the env var; this exists for patch-level overrides. |
| `baseUrl` | `https://mcp.postiz.com` | Postiz host. The MCP endpoint is `<baseUrl>/mcp`. Self-hosted instances point this at their backend. |
| `skill` | `true` | Register the `postiz` skill on `ctx.skills`. |

Without a key the `postiz` row logs a warning naming the variable to set, and the
`postiz-mcp` row registers no tools. dsh keeps booting.

## Self-hosted Postiz

The MCP server is part of the Postiz backend and listens at `/mcp` (Bearer auth). Point
`baseUrl` at your backend and make sure your reverse proxy forwards `/mcp` with streaming
HTTP enabled. See [Reverse Proxies](https://docs.postiz.com/self-host/reverse-proxies/caddy).

## Development

```bash
cd plugins/dsh-postiz
pnpm install
pnpm test
```

Link a local checkout into a profile:

```bash
dsh plugin --profile web add /absolute/path/to/postiz-agent/plugins/dsh-postiz
```

## Related

- [Postiz CLI](https://github.com/gitroomhq/postiz-agent) — the `postiz` command-line tool and the Claude Code / Cursor / Grok plugins in this repository.
- [Postiz MCP docs](https://docs.postiz.com/mcp/introduction)
- [Postiz public API](https://docs.postiz.com/public-api/introduction)

## License

AGPL-3.0, same as the rest of this repository.
