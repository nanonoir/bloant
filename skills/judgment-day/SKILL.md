---
name: judgment-day
description: "Run independent parallel double review only when the user explicitly requests Judgment Day or double review."
license: Apache-2.0
---

# Judgment Day

Activate only on an explicit request for Judgment Day or double review.

1. Establish one stable review target, requirements, constraints, relevant skills, and available validation evidence. Clarify the scope only if necessary.
2. Launch two independent `reviewer` executions in parallel with identical inputs. Both are read-only and must not see the other's conclusions. Keep the target unchanged during review. Use the reviewers' current report format.
3. Wait for both results before issuing a verdict. A failed or missing review is not approval.
4. Consolidate findings by evidence, not vote count. Investigate contradictions; do not dismiss a reproducible defect because only one reviewer found it. Distinguish confirmed critical issues, non-critical findings, and unresolved uncertainty.
5. A review request does not authorize edits. Use existing correction authorization when applicable; otherwise request it. Assign confirmed, authorized critical corrections to `fix-agent`, with concrete evidence and bounded scope. Preserve its current report format.
6. Allow at most two correction rounds. After each, run two independent read-only reviewers in parallel against the same updated target, scoped to the corrections, affected behavior, and possible regressions. Wait for both results each time.
7. Escalate if critical issues or critical disagreements remain, essential evidence is insufficient, corrections are unauthorized, or either required review cannot complete. Do not extend the two-round limit.

## Final Result

Summarize the reviewed scope, consolidated findings, corrections and rounds used, validation evidence, and unresolved items. Non-critical findings may remain with explicit disclosure.

End with exactly one verdict:

- `JUDGMENT: APPROVED` — both reviews completed, with no unresolved critical issues or essential evidence gaps.
- `JUDGMENT: ESCALATED` — acceptance remains blocked; state the evidence or decision needed.
