---
name: testing
description: Select, design, run, and debug tests using the fastest reliable approach proportional to risk. Apply to any testing or verification task.
---

# Testing

## Principle

Choose the lowest-total-cost verification that reliably covers the behavior at risk, in proportion to how bad a failure would be. Fast feedback matters: weigh run time, reliability, CPU/RAM/disk, maintenance, and repeat cost. More automation is not inherently better, and speed must not replace meaningful risk coverage.

## Authority

- Repository and global instructions decide when tests may run and how broad they may be. If they limit feature or development branches to relevant unit and integration tests and reserve full suites for pre-PR validation against the main branch, follow that; do not substitute your own branch names.
- Ordinary cheap tests (unit, integration, deterministic contract checks) need no extra approval; write and run them as part of the work.
- Do not autonomously add disproportionately expensive automation (large E2E matrices, bulk visual or screenshot suites, long-running suites, heavy infrastructure) or any synthetic stress/load test without explicit authorization. Where expensive automation seems necessary and no cheaper trustworthy check exists, report the risk, proposed check, expected cost, and alternatives, then ask.
- Do not leave high-risk behavior (payments, auth, security, data integrity) unverified; use economical checks or a documented manual check.

## Choosing checks

- Unit for isolated logic and contracts; integration for component interactions; E2E only when a real browser or full environment is required and the confidence justifies the cost; minimal representative visual snapshots, never per-frame sampling.
- A short documented manual check beats costly automation when reliable automation is disproportionate. State the steps and result, and never claim an unperformed check passed.
- Check existing coverage first; avoid duplicate checks across layers, browsers, viewports, or environments unless each catches a distinct risk.

## Running and diagnosing

1. Define the behavior, expected result, and risk.
2. Run the smallest relevant set first; widen only if the risk or change warrants it. Limit parallelism to available resources and avoid overlapping heavy runs.
3. On failure, find the root cause. Do not raise timeouts, add retries or fixed waits to hide flakiness or slowness; investigate slow tests rather than accepting them.
4. Keep artifacts (logs, traces, screenshots) minimal and preserve useful failure evidence; remove task-owned temporary artifacts.
5. Stop browsers, dev servers, and child processes you started, including after failures.

## Reporting

State what passed, what failed, what was not verified and why, and any manual steps or approvals needed.
