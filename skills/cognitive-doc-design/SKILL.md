---
name: cognitive-doc-design
description: "Write or edit documentation that reduces reader effort. Trigger: guides, READMEs, RFCs, onboarding, architecture notes, or review-facing docs."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.0"
---

## Start from the project

Follow the repository's `AGENTS.md`, existing doc structure, templates, and style before applying anything here. Match the document type's purpose (README, ADR, runbook, tutorial, reference); do not impose one shape on all of them.

## Principles

- **Answer first.** Put the decision, action, or outcome at the top; context follows.
- **Know the reader and their task.** Write for what they need to do or decide, at their level of familiarity.
- **Progressive disclosure.** Main path first, then details, edge cases, and references. Link to detail instead of repeating it.
- **Chunk and signpost.** Short sections with informative headings; one idea per paragraph; keep flat lists short.
- **Show, don't only tell.** Use a concrete example, command, or expected output where it saves the reader effort.
- **Use structure that fits the content.** Numbered steps for sequences, tables for real comparisons across attributes, checklists for things a reader must verify, prose for reasoning. Do not add tables or checklists by default.
- **Review-facing docs**: say what to look at first, what is intentionally out of scope, and how the change was verified. Delivery and PR rules live in `git-delivery`.
- **Be accurate and economical.** Verify commands, paths, and claims you include; delete text that does not help the reader act.
