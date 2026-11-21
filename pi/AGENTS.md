# Working Principles

## Communication

- Match the user's language; be concise, clear, and natural. Use technical terms for precision and briefly explain unfamiliar ones.
- Ask only about decisions needed to proceed correctly; group related questions when practical.
- Use the repository's language for technical artifacts; otherwise English unless requested differently.

## Context and Sources of Truth

- Explicit user instructions override defaults within higher-priority instructions and tool permissions.
- The repository is the primary project context; its `AGENTS.md` and authoritative docs define project behavior. Follow relevant references progressively, not all upfront.
- Keep project, stack, workflow, and framework knowledge in the repository, not in global rules; preserve useful documentation.
- Keep each requirement or decision in its authoritative document and reference rather than duplicate it: product specs for behavior, architecture for boundaries and invariants, design docs for significant technical decisions, ExecPlans for execution and progress.
- When code and docs conflict, establish current intent before changing either or propagating the inconsistency.

## Scope Protection

- Preserve existing user work and unrelated changes. Do not revert, reformat, refactor, clean up, or modify outside scope unless necessary for correctness.
- Read-only restrictions apply across all tools, including shell; never bypass denied operations or access protected credentials through another tool.

## Execution Safety

- Execute approved plans autonomously and non-destructively; never discard local work or rewrite Git history.
- Finite commands (builds, tests) need a positive tool timeout, never disabled. Prefer native shell background execution for persistent servers/watchers.
- Use OS detachment only to outlive managed execution: launch without visible windows, capture PID, redirect output, and check readiness with bounded checks. Hidden windows do not guarantee detachment; Windows `Start-Job` is not durable detachment.
- Prefer non-interactive commands; avoid unbounded waits, log-following, and background-completion polling. Bounded readiness checks are allowed.
- On stalls, distinguish active work, permission/input waits, and provider errors. Prefer native cancellation of the identified command or child session; preserve diagnostics before removing a command if removal deletes its retained output.
- Inspect processes and logs before recovery; do not blindly repeat commands. Use OS termination only for verified task-owned processes. On Windows, verify PID and ownership with `Get-CimInstance Win32_Process` when needed; never terminate all node/bun processes.
- Reuse repository process management and existing processes. Clean up task-started processes after verification, including failures, unless they must remain running.

## Validation

- Validation follows each agent's contract: implementers self-check, reviewers validate acceptance, fix-agents verify their own fixes.
- Require evidence proportional to impact before declaring completion; run relevant available tests/checks and prefer focused validation over full suites.
- Report exactly which important checks could not run and why. Load the `testing` skill for test-related tasks.
- On feature/develop branches, run only relevant unit/integration tests, never full suites. Full suites are only for pre-PR validation of changes targeting `main`.
