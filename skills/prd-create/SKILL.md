---
name: prd-create
description: "Create a Product Requirements Document (WHAT and WHY) for a feature, refactor, migration, or integration. Use when the user asks for a PRD or when requirements must be settled before design."
license: Apache-2.0
metadata:
  author: nanoir
  version: "2.0"
---

# PRD Create

Skip trivial fixes, small local edits, or requests where an agreed PRD or canonical product spec already covers the behavior.

## Conventions first

Start with the repository's `AGENTS.md` and its references. Follow the consuming project's conventions for PRD location, naming, template, language, and canonical specs (for example a product-specs index). Update an existing canonical spec when the behavior belongs there instead of creating a duplicate. If no convention exists, place the PRD where the user indicates or ask where it should live. Do not assume a path, tracking tool, or memory system.

## Principles

- Define WHAT and WHY, not HOW. Leave implementation, architecture, and technical design to downstream work.
- Investigate discoverable facts (codebase, docs, existing specs) yourself.
- Do not invent material product decisions or reopen decisions the user already made unless they conflict.
- Ask only about decisions that change scope, behavior, contracts, compatibility, security, business rules, or acceptance. Group related questions, order by dependency, offer options with brief tradeoffs and a recommendation, and wait for confirmation. Ask through the actor that owns user interaction: if you are a subagent, report the open decisions to the parent/orchestrator instead of asking the user directly.

## Content

Include what applies, sized to the change:

- Overview and problem (why now, who is affected)
- Goals and success criteria
- Users and workflows, including alternate and error paths
- Business rules, invariants, and non-functional requirements
- Scope and explicit non-goals
- Verifiable acceptance criteria (observable behavior; Given/When/Then only where it clarifies)
- Open decisions, if any remain

Tailor emphasis: for refactors, behavior to preserve and non-regression; for migrations/integrations, data parity, compatibility, cutover, and rollback.

## Check before finishing

- No contradictions; acceptance criteria match agreed behavior and are verifiable.
- No implementation details leaked in; non-goals stated.
- Unresolved material decisions are listed, not guessed.

Report the PRD location, a short summary of goals, scope, and non-goals, and the decisions established or still open.
