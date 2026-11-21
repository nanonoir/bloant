# Judgment Day Handoffs

The [skill](../SKILL.md) defines the workflow and final judgment. Use the current `reviewer` and `fix-agent` contracts for their reports; no additional result schema is required.

## Reviewers

Send both reviewers the same stable target, scope, requirements, constraints, relevant skills, and validation evidence. Require read-only independent review without access to the other's conclusions. For revalidation, include the correction delta and affected behavior, including possible regressions.

## Corrections

Send `fix-agent` only confirmed, authorized critical issues, their locations and evidence, expected behavior, and correction boundaries. Request focused validation and a report of unresolved issues. The parent tracks the maximum of two correction rounds and waits for both revalidations after each round.
