---
name: init-harness
description: Initialize, update, or migrate the current repository documentation harness using the `init` specialist (Sonnet, medium effort).
---

# Initialize Repository Documentation Harness (`/init-harness`)

Delegate to the `init` subagent (`~/.claude/agents/init.md`, pinned to `sonnet` with `medium` effort) so the current repository gets a clean, minimal, progressively discoverable documentation harness (`AGENTS.md`, `ARCHITECTURE.md`, `docs/`, `exec-plans/active` and `completed`, etc.).

## Execution Steps

1. Spawn the `init` subagent and instruct it to inspect the actual project state, preserve valid existing knowledge, leave the repository in a coherent state, and include any additional scope provided by the user.
2. Once `init` finishes, review its summary and verify the created or updated documentation files before reporting back to the user.
