---
name: init
description: Initialize, update, or migrate the current repository documentation harness using the `init` specialist on `gemini-4-neon-medium`.
---

# Initialize Repository Documentation Harness (`/init`)

Delegate to the `init` specialist so the current repository gets a clean, minimal, progressively discoverable documentation harness (`AGENTS.md`, `ARCHITECTURE.md`, `docs/`, `exec-plans/active` and `completed`, etc.).

## Execution Steps

1. Prefer spawning a `swarm` worker (`action: "add"`) with:
   - `name`: `"init"`
   - `model`: `"gemini-4-neon-medium"`
   - `workspace`: `"inherit"`
   - `brief`: Instruct it to follow its full contract in `~/.gemini/config/agents/init.md`, inspect the actual project state, preserve valid existing knowledge, leave the repository in a coherent state, include any additional scope provided by the user, and report back to `@coordinator` when done.
2. If `swarm` is unavailable, fall back to `invoke_subagent` with `TypeName: "init"` and `Model: "inherit"`.
3. Once the `init` worker reports completion, review its summary, verify the created/updated documentation files, and terminate the temporary worker (`swarm(action="kill", name="init")`).
