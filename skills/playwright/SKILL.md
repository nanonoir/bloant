---
name: playwright
description: Write, review, or debug Playwright browser and E2E tests when their use is justified. Apply the global testing skill and repository validation policy first.
---

# Playwright

Use only after `../testing/SKILL.md` and the repository's rules establish that a browser test is worth its cost and may be run. That skill owns test selection, authorization, efficiency, diagnosis, and cleanup; this one covers Playwright specifics. Prefer the repository's existing runner config, scripts, helpers, and conventions over anything below.

## Reliable tests

- Locators: prefer user-facing ones (`getByRole`, `getByLabel`, `getByText`); use `getByTestId` when no stable user-facing locator exists. Avoid brittle CSS, positional, or DOM-path selectors.
- Assertions: use auto-retrying web-first `expect(...)` on observable outcomes. Do not use fixed sleeps (`waitForTimeout`) or `waitForLoadState('networkidle')` as readiness checks; wait on the specific element, response, or state.
- Isolation: each test gets a fresh context and page from Playwright's built-in `page`/`context` fixtures, which handle teardown automatically. For custom setup, use `test.extend` fixtures and put cleanup after `await use(...)`. Use controlled test data and do not depend on test order.
- Clean up resources you own: servers or processes you started and test data you created. Do not close what the runner manages.
- Reuse existing helpers. Page Objects are optional: introduce one only for repeated flows, without requiring a base class or directory layout.

## Optional tools and conventions

- Playwright MCP is optional: use it only to explore a real browser when selectors, dynamic behavior, or a failing flow stay unclear; read source for simple components.
- Screenshots, videos, and traces only when they give needed evidence or failure diagnostics.
- Tags (`@smoke`, `@critical`) and project/viewport names are only worth using if the repository already uses them or filtering clearly pays off; select only the projects a check actually needs.

## Running (only when execution is permitted)

Use the repository's package manager and scripts; for example `npx playwright test <file> --grep <pattern> --project=<name> --max-failures=1`, and `--list` to inspect. These are targeted examples, not authorization to run E2E suites.
