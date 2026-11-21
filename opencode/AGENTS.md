# Working Principles

## Communication

- Match the user's language. Be concise, clear, and natural. Use technical terms only when they add precision; briefly explain unfamiliar terms.
- Ask questions only when unresolved decisions are necessary to proceed correctly. Group related pending decisions when practical instead of interrupting the work repeatedly.
- Follow the repository's language for documents, code, and other technical artifacts; otherwise use English unless requested differently.

## Repository Context

- The repository is the primary source of truth for project context.
- Read its `AGENTS.md` and follow relevant references progressively; do not load all documentation upfront.
- Keep project-specific knowledge in the repository.
- Preserve useful documentation and existing user work.

## Instruction Precedence

- Explicit user instructions take precedence over default conventions, within higher-priority instructions and tool permissions.
- The repository's `AGENTS.md` and authoritative project documentation define repository-specific behavior.
- Global rules define general working principles; do not duplicate project, stack, workflow, or framework knowledge here.

## Sources of Truth

- Keep each requirement or decision in its authoritative document; reference it instead of duplicating it.
- Product specs describe expected behavior.
- Architecture defines structural boundaries and invariants.
- Design docs record significant technical decisions.
- ExecPlans describe execution and track progress.
- When code and relevant documentation conflict, investigate which reflects current intent before changing either or propagating the inconsistency.

## Scope Protection

- Do not revert, reformat, or modify work outside the current task unless necessary to complete it correctly.
- Avoid opportunistic refactoring or cleanup outside the agreed scope.
- Preserve unrelated user changes.
- Read-only restrictions apply across all tools, including shell. Never use another tool to bypass a denied operation or access protected credentials.

## Git Organization

- Work on a task branch before editing; never implement on the default branch.
- Keep one coherent delivery unit per branch. Define boundaries early and separate new units as scope grows; chain dependent branches.
- Commit completed increments locally with their related tests and documentation. The orchestrator owns branch and commit organization.
- Prepare delivery incrementally; do not reconstruct branches or redistribute accumulated changes at the end.
- Never use `git restore`. Push, PR creation and merge require user authorization.

## Execution Safety

- Execute approved plans autonomously using non-destructive operations; never discard local work or rewrite Git history.
- Finite commands must retain a positive tool timeout; the foreground default is sufficient when appropriate. Never disable their timeout.
- Distinguish finite tasks (builds, tests) from persistent processes (servers, watchers). Prefer native shell background execution for persistent processes so the call returns immediately.
- Use OS-level detachment only when the process must outlive the managed execution; then launch without visible windows, capture its PID, redirect output, and verify readiness with bounded checks. Hiding a window does not guarantee process detachment.
- Prefer non-interactive commands. Avoid unbounded waits and log-following. Avoid polling for background completion; bounded readiness checks are allowed.
- On stalls, distinguish active execution from permission/input waits and provider errors. Prefer native cancellation of the identified command or child session; preserve needed diagnostics before removing a shell command, which also removes its retained output.
- Use OS termination only for verified task-owned processes. Inspect processes and logs before recovering with a different approach; do not blindly repeat the same command.
- On Windows, identify task-owned processes by PID and ownership using Get-CimInstance Win32_Process when necessary. Never terminate all node/bun processes. Start-Job is not durable detachment.
- Reuse repository-provided process management mechanisms and existing processes. Clean up processes started by the task after verification, including on failure, unless they must remain running.

## Validation

- Validation follows each agent's contract: implementers self-check, reviewers validate acceptance, fix-agents verify their own fixes.
- Reuse existing validation evidence. Do not repeat another agent's checks or rerun them for delivery; if changes invalidate evidence, the responsible agent performs focused revalidation.
- Do not declare work complete without proportional evidence that it works.
- Run relevant available tests or checks according to the impact of the change.
- Prefer focused validation when sufficient; do not require full suites by default.
- If important validation cannot be performed, report exactly what was not checked and why.
- For any test-related task, load the `testing` skill.
- On feature or develop branches, run only relevant unit and integration tests; never run full suites.
- Run full suites only as pre-PR validation for changes targeting `main`.
