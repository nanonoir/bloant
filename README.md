<p align="center">
  <img src="./assets/bloant-banner.jpg" alt="bloant — Fast by default. Adaptive by design. Complexity on demand." width="100%" />
</p>

<h1 align="center">bloant</h1>

<p align="center">
  <strong>Fast by default. Adaptive by design.</strong><br />
  A portable multi-harness agent setup for <strong>OpenCode</strong>, <strong>Pi</strong>, <strong>Antigravity CLI</strong>, <strong>Claude Code</strong>, and <strong>Codex CLI</strong> — built for speed, pragmatism, and complexity on demand.
</p>

<p align="center">
  <a href="#philosophy">Philosophy</a> ·
  <a href="#how-it-scales">How It Scales</a> ·
  <a href="#whats-inside">What's Inside</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#environment--security">Environment & Security</a>
</p>

---

## Philosophy

**Bloant** is an agentic harness designed around speed, pragmatism, and adaptability. Its goal is to maximize agent execution capability without introducing unnecessary complexity, bureaucracy, or resource waste.

- **Speed by default** — execute quickly and minimize operational friction.
- **Pragmatism over dogma** — prioritize outcomes over rigid processes and avoid over-engineering.
- **Complexity on demand** — scale planning, delegation, implementation, and verification to match the scope and risk of each task.
- **Specialization when needed** — bring in specialist agents when they add real value, never out of habit.
- **Resource efficiency** — optimize tokens, context window, wall-clock time, and reasoning effort.

> A simple task should be solved directly; a complex task should have full planning, coordination, and specialization available.
>
> **Complexity is a capability, not a requirement.**

---

## How It Scales

| Task Size | Execution Mode | Specialists & Artifacts |
| :--- | :--- | :--- |
| **Small** | Direct execution in the primary session | No forced pipeline; focused validation only |
| **Medium** | Scoped exploration + targeted implementation | Selective delegation (`explorer`, `implementer`) + focused tests |
| **Large** | Coordinated multi-agent delivery | ExecPlans, independent review (`reviewer`, `fix-agent`), and closure (`archiver`) |

All five harnesses share the same role contracts (`explorer`, `specs-writer`, `designer`, `implementer`, `reviewer`, `fix-agent`, `archiver`, `init`, plus `teacher` mode for guided learning) and the same progressive-disclosure documentation model (`AGENTS.md` → `ARCHITECTURE.md` → `docs/` → `exec-plans/{active,completed}`).

---

## What's Inside

| Directory | Target on Windows | Highlights |
| :--- | :--- | :--- |
| [`opencode/`](./opencode) | `~/.config/opencode` | Global `AGENTS.md`, 9 agent roles, `/init` command, `@slkiser/opencode-quota` (Claude + Codex), `sub-agent-statusline`, and portable `opencode.json` / `cli.json` templates |
| [`pi/`](./pi) | `~/.pi/agent` | `AGENTS.md` + `APPEND_SYSTEM.md`, 8 specialist roles, `opencode-permissions` & `subagent` extensions, `teacher` mode, themes (`opencode-clean`, `steel-blue`), and `settings.json` |
| [`agy/`](./agy) | `~/.gemini/config` & `~/.gemini/antigravity-cli` | Plugin-free Antigravity CLI harness: unified `AGENTS.md` with exact-model `swarm` routing, 8 subagents + `teacher`, `/init` skill, `skills.json`, `mcp_config.json`, `permissions.json` (`allow`/`ask`/`deny` guardrails mirrored from OpenCode), and OpenCode-style `statusline.mjs` (AGY 5h/7d quota bars) |
| [`claude/`](./claude) | `~/.claude` & `~/.claude.json` (`mcpServers`) | Claude Code harness: unified `CLAUDE.md` (deduplicated with OpenCode), 9 native subagents (`haiku`/`sonnet`/`opus` at `medium` effort), `/init-harness` skill, 4 MCP servers merged non-destructively, `settings.json` defaults, and OpenCode-style `statusline.mjs` |
| [`codex/`](./codex) | `~/.codex` | Codex CLI harness: `AGENTS.md`, `config.toml` (`gpt-6.2-sol` low orchestrator, `multi_agent = true`, 4 MCP servers with env-based auth), 9 TOML subagent configs (`gpt-6.2-sol` / `gpt-6-luna` / `gpt-6.1-terra` at `medium` effort), and `/init-harness` skill |
| [`skills/`](./skills) | `~/.agents/skills` | 30 shared, on-demand skills loaded across OpenCode, Pi, AGY, and Codex |
| [`scripts/sync.ps1`](./scripts/sync.ps1) | — | Idempotent Windows deployment script with `-DryRun` and `-InstallDeps` |

```text
bloant/
├── assets/
│   └── bloant-banner.jpg
├── opencode/
│   ├── AGENTS.md
│   ├── opencode.json
│   ├── system-permissions.json
│   ├── cli.json
│   ├── package.json
│   ├── tui-preferences.jsonc
│   ├── agents/
│   ├── commands/
│   ├── opencode-quota/
│   └── vendor/
├── pi/
│   ├── AGENTS.md
│   ├── APPEND_SYSTEM.md
│   ├── settings.json
│   ├── mcp.json
│   ├── pi-atelier.json
│   ├── profile-cycler.json
│   ├── subscription-panel.json
│   ├── agents/
│   ├── extensions/
│   ├── modes/
│   ├── prompts/
│   └── themes/
├── agy/
│   ├── AGENTS.md
│   ├── skills.json
│   ├── mcp_config.json
│   ├── permissions.json
│   ├── statusline.mjs
│   ├── agents/
│   └── skills/
│       └── init/SKILL.md
├── claude/
│   ├── CLAUDE.md
│   ├── settings.json
│   ├── mcp.json
│   ├── statusline.mjs
│   ├── agents/
│   └── skills/
│       └── init-harness/SKILL.md
├── codex/
│   ├── AGENTS.md
│   ├── config.toml
│   ├── agents/
│   └── skills/
│       └── init-harness/SKILL.md
├── skills/
└── scripts/
    └── sync.ps1
```

---

## Quick Start

### 1. Preview changes (no files written)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync.ps1 -DryRun
```

### 2. Deploy all harnesses and shared skills

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync.ps1 -InstallDeps
```

What `sync.ps1` does automatically:
1. Resolves machine-specific placeholders (`{{OPENCODE_CONFIG_DIR}}`, `{{NPM_GLOBAL_BIN_DIR}}`, `{{SKILLS_DIR}}`, and `{{GITHUB_PERSONAL_ACCESS_TOKEN}}`).
2. Copies OpenCode, Pi, Antigravity CLI, Claude Code, Codex CLI, and shared skills into their standard user directories.
3. Enables the custom `statusline.mjs` in `~/.gemini/antigravity-cli/settings.json` and `~/.claude/settings.json`, and merges Claude `mcpServers` into `~/.claude.json` without touching auth or session state.
4. Preserves local `deviceId`, secrets, auth files, caches, and session history.

---

## Environment & Security

- **GitHub MCP:** set `GITHUB_PERSONAL_ACCESS_TOKEN` in your environment before running `sync.ps1`.
- **Optional CLI / MCP prerequisites:** Node.js `>= 20`, `git`, `codegraph`, `npx` (`@playwright/mcp`), `rg`, `fd`, `claude`.
- **Never committed (ignored via [`.gitignore`](./.gitignore)):** `service.json`, `auth.json`, `mcp-auth.json`, `account.json`, `antigravity-accounts*`, `antigravity-auth-vault/`, `antigravity-bridge/`, `sessions/`, `missions/`, `opencode.db`, caches, and `node_modules/`.
