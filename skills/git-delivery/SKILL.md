---
name: git-delivery
description: Plan and execute Git delivery with logical commits, size-bounded chained PRs, and authorized merges. Use when preparing a delivery, splitting changes into PRs, or executing commit/push/PR/merge requests.
---

# Git Delivery

The orchestrator executes delivery. Follow global authorization rules and repository conventions; do not introduce a Git subagent, delivery YAML, or a mandatory development workflow.

## Inspect and Plan

- Inspect Git status, staged and unstaged diffs, recent commits, remote tracking, and the intended target branch. Identify existing user work before staging.
- Use the user's target branch or a verifiable repository default; ask if the destination is ambiguous. Never assume `main` or `develop`.
- Follow repository branch naming, PR templates, checks, and merge policy. Do not invent issue requirements or labels.
- Divide the change into coherent units before committing. Each unit gets a branch, the necessary logical commits, and one PR. Use a single PR when the change fits one unit.
- Include related tests and documentation with their implementation. Do not split by file type or create extra commits just to satisfy a count.
- Each unit must leave the target branch valid when merged in order. Do not meet the size limit by shipping broken intermediate states.

## Size Budget

Count manually authored code additions plus deletions in each PR's diff against its actual base. Tests count as authored code.

| Authored code lines | Rule |
|---|---|
| 0–400 | Target size. |
| 401–600 | Allowed when the unit remains coherent and reviewable. |
| More than 600 | Split; proceed only with an explicit user-approved `size-exception` for that PR. |

- Exclude documentation, generated files, and lockfiles from the budget, not from commits, review, or validation. Classify exclusions using repository evidence; do not exclude all files of an extension or treat configuration code as documentation.
- Measure the actual diff before opening a PR and after relevant changes to its contents or base. Report authored additions/deletions separately from excluded changes.
- A general delivery approval does not authorize an oversized PR. Keep the exception's rationale and approval in the relevant ExecPlan when present, and disclose it in the PR body. Apply a `size-exception` label only if repository policy provides one.

## Chained PRs

Use one strategy: the first branch starts from the target; each subsequent branch starts from its predecessor. Each PR targets its immediate predecessor until that predecessor is integrated.

```text
target
└── feat/change-01   PR 1 → target
    └── feat/change-02   PR 2 → feat/change-01
        └── feat/change-03   PR 3 → feat/change-02
```

- Review all commits included in each PR and its diff against that PR's base, not only the latest commit.
- Add concise dependency/order information, a summary, validation evidence, and size accounting to the repository's PR template. No tracker PR or mandatory diagram is needed.
- Integrate in order. After merging a predecessor, retarget the next PR to the target branch and verify that its diff contains only its own unit.
- Preserve predecessor branches until dependent PRs are safely retargeted; account for automatic branch deletion.
- Prefer ancestry-preserving merges when repository policy allows them. Squash/rebase merges may leave predecessor changes in child diffs: retargeting alone is not sufficient. Use [chain maintenance](references/chain-maintenance.md) without force-pushing.

## Execute and Verify

- Branch creation: never use `git checkout -b` or `git switch -c`. Always use two steps: `git branch <name>` then `git switch <name>` to avoid permission filter collisions.
- Stage only intended paths or hunks. Inspect the staged diff and use Conventional Commits without AI attribution.
- Reuse successful validation when the relevant content is unchanged. Run focused checks for new changes or integration concerns; do not rerun full suites merely because delivery started.
- Push before opening the PR. Use `gh` for PR creation, updates, checks, and merge; use the `gh` skill for CLI details when needed.
- An explicit request for PR creation plus merge to the target authorizes the pushes, PRs, and ordered merges necessary for that delivery scope. Do not ask again for each PR. PR-only authorization does not imply merge authorization.
- Merge only when authorized, applicable required checks pass, review requirements are satisfied, and the PR is mergeable. Report actual blockers; never bypass branch protection or use destructive Git operations.
- Return PR URLs, merge results, and any remaining work. Delivery does not replace delegated archival of important changes.
