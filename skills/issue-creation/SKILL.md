---
name: issue-creation
description: "Draft well-structured GitHub issues (bugs, feature requests) that follow the target repository's templates and conventions. Trigger: writing or filing a GitHub issue."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.0"
---

## Authority

Drafting an issue does not authorize publishing it. Create, edit, label, or close issues on the remote only when the user's current or earlier instructions already cover that action; otherwise present the draft and ask once.

## Workflow

1. **Learn the repository's conventions.** Read `AGENTS.md`/`CONTRIBUTING`, `.github/ISSUE_TEMPLATE/` (issue forms `.yml` or Markdown templates, and `config.yml` for blank-issue and contact-link settings). Remote repos: read these via `gh api repos/OWNER/REPO/contents/.github/ISSUE_TEMPLATE` (see the `gh` skill). `gh issue create` has no inspection mode; it creates an issue.
2. **Check for duplicates**: `gh issue list -R OWNER/REPO --state all --search "<keywords>" --limit 20`. Link a related or duplicate issue instead of filing a new one. Questions or support requests go where the repository says they belong (for example Discussions).
3. **Draft** with the repository's template fields. Use only labels, types, and title conventions the repository defines; never invent labels or approval workflows.
4. **Review** the draft against Content below, then hand it to the user or publish if already authorized.

## Content

- **Title**: specific and scannable; follow the repository's title convention if any.
- **Bug**: summary, minimal reproduction steps, expected behavior, actual behavior (exact errors or logs), environment (version, OS, runtime) when relevant.
- **Feature**: the problem or need first, then the proposed outcome and alternatives considered; avoid prescribing implementation unless asked.
- State known facts and mark guesses as guesses. Redact secrets, tokens, and private data from logs.
- Without a template, use short sections: Context, Problem or Reproduction, Expected vs Actual, Additional context.

## Publishing mechanics

Use `--body-file` for multi-line bodies so quoting stays safe, and pass the target explicitly:

```bash
gh issue create -R OWNER/REPO --title "<title>" --body-file issue.md
```

`--template "<name>"` is for interactive use and cannot be combined with `--body` or `--body-file`. For noninteractive use, read and populate the repository template or form fields, then pass `--title` and `--body-file` as above. Verify flags with `gh issue create --help`. Add `--label`, `--type`, `--assignee`, or `--project` only when the user asked or the template requires them.
