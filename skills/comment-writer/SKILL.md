---
name: comment-writer
description: "Write concise, evidence-backed collaboration comments. Trigger: PR feedback, issue replies, reviews, chat or async project messages."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.0"
---

## Authority

Drafting, posting, and approving are different actions. Draft the text by default. Post only when the user has asked for it or already authorized posting to that thread. Approve, request changes, resolve, or merge only on the user's explicit decision or authority, never as a side effect of writing a comment.

## Principles

- **Lead with the actionable point.** Do not recap the whole change first.
- **Ground it in evidence**: cite the file, line, behavior, log, or test that supports the point, and say what you did not verify.
- **Explain why** when asking for a change; name the concrete risk or benefit.
- **Prioritize.** Raise the highest-value issues; mark minor preferences as optional (for example "nit") or leave them out.
- **Be direct and warm.** Sound like a thoughtful teammate; keep it to a few short paragraphs or a tight list.
- **Match the context's language and tone.** Reply in the thread's language (mixed: the target message's language) unless the user asks otherwise. Follow the user's requested tone and the project's conventions.
- Suggest a concrete next step. For PR size or splitting questions, follow the `git-delivery` skill instead of restating its budgets.

## Shape

```text
<Observation or request, with evidence>

<Why it matters, if not obvious>

<Concrete next step>
```

## Examples

```markdown
`parseDate` returns `null` for `2024-02-30` (see the failing case in `date.test.ts`), and `renderRow` dereferences it on line 48.
Could we return a validation error here, or guard the call site? A test for the invalid date would lock it in.
```

```markdown
Looks good to me. One non-blocking thought: the retry count in `client.ts` could be a named constant so the timeout test can reference it.
```

Inspect before commenting when useful: `gh pr view <PR> --json title,body,files` and `gh pr diff <PR>`.
