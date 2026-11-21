---
description: "GitHub CLI (gh) mechanics for agents: noninteractive use, structured output, bounded results, repo targeting, search vs list, gh api."
metadata:
    github-path: skills/gh
    github-ref: refs/tags/v2.98.0
    github-repo: https://github.com/cli/cli
    github-tree-sha: 154bc0dd97910bc8ae084f2ab66af95dcaf4fdac
name: gh
---
# gh

Mechanics only. Branch, PR, and delivery rules belong to the repository and to `git-delivery`. Mutating commands (create, edit, comment, merge, close, API writes) act on a remote: run them only within authority the user has already given. Check `gh --version` and `gh <command> --help` before relying on newer flags. Manual: https://cli.github.com/manual

## Noninteractive use

Without a TTY, `gh` skips the pager and color and fails instead of prompting (for example, `--title` and `--body`/`--body-file` are required for create). Set `GH_PROMPT_DISABLED=1` to force no prompts. There is no `--no-pager` flag. `GH_FORCE_TTY=1` turns TTY behavior on; leave it unset.

## Structured output

- `--json a,b,c` selects fields; run `--json` with no fields to list the available ones.
- `--jq '<expr>'` filters without a separate `jq`; `--template '<go template>'` shapes text (both need `--json`). On `issue create`/`pr create`, `-T` means `--template` body template, so use the long form deliberately.
- `gh issue list` and `gh pr list` do not expose `totalCount`; use GraphQL when a true total matters.

## Bounded results and pagination

- List and search commands cap at 30 by default: pass `-L N`/`--limit N` and treat results as possibly truncated.
- `gh api --paginate <endpoint>` fetches all pages; `--jq` filters each page separately. For pages of arrays, use `--paginate --jq '.[]'` without `--slurp`, or use `--paginate --slurp | jq '.[][]'` to flatten the outer array of pages downstream.

## Repo targeting

Commands infer the repo from the current directory's remotes. For determinism pass `-R [HOST/]OWNER/REPO` (or set `GH_REPO`). `gh api` has no `-R/--repo`: write the endpoint explicitly (`repos/OWNER/REPO/...`) and use `--hostname HOST` for non-github.com hosts. `{owner}`/`{repo}` placeholders are filled only from the current repo context or `GH_REPO`.

## Search vs list

- `gh search issues|prs|code|repos|commits|users` uses the search index. Pass each qualifier as its own token (`gh search issues repo:cli/cli is:open`); one quoted string like `"repo:x is:open"` is parsed as a single keyword and fails. Quote only free text.
- `gh issue list --search "<query>"` and `gh pr list --search "<query>"` take one quoted query and are scoped to the repo.
- For GitHub App authors (bots), use `--app <slug>`, which `gh search issues|prs` and `gh issue|pr list` support. Check `--help` before using other author forms.

## `gh api`

Use it for data typed commands do not expose, for example PR review-thread comments (`gh api repos/OWNER/REPO/pulls/N/comments`) or GraphQL (`gh api graphql -f query='...' -F var=value`). The method defaults to GET and switches to POST when `-f`/`-F` fields are added; `-X GET` keeps fields as query parameters. Writes via `gh api` are remote mutations.

## Authentication

`gh auth status` shows hosts, accounts, and active state. With `--json hosts` it exits 0 even when an account has authentication problems, so inspect the reported state rather than the exit code. Never print or log tokens (do not use `--show-token` or `gh auth token`). `GH_TOKEN` takes precedence over `GITHUB_TOKEN`.

## Other

`gh pr checkout N` switches the current branch (`--worktree <path>` uses a worktree); to only read, use `gh pr view N` or `gh pr diff N`.

Preview and version-dependent commands (discussions, reading repo files, issue types and relationships, semantic search): see `references/preview-and-advanced.md`.
