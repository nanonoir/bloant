---
name: nextjs-16
description: "Next.js 16 App Router patterns: async request APIs, proxy, caching, Server Actions, route handlers. Use when working on a Next.js project, after checking its installed version."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.0"
---

# Next.js 16

Check `package.json`, the lockfile, and `next.config.*` first. Apply this skill to Next 16 projects; do not upgrade versions or enable opt-in features unless asked. For other versions, follow that version's docs. Requirements: Node.js >=20.9, TypeScript >=5.1. Docs: https://nextjs.org/docs/app

## Request APIs are async

`cookies()`, `headers()`, `draftMode()`, and `params` must be awaited. `searchParams` exists only on `page` props, not on layouts.

```tsx
import { cookies } from "next/headers";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { id } = await params;
  const { q } = await searchParams;
  const session = (await cookies()).get("session");
  // ...
}
```

`params` is also a Promise in layouts, route handlers (second argument), and `generateMetadata`. `npx next typegen` generates `PageProps`/`LayoutProps` helpers. Components are Server Components by default; add `"use client"` only for state, effects, event handlers, or browser APIs.

## Proxy (replaces middleware)

`middleware.ts` is deprecated in favor of `proxy.ts` exporting `proxy`; it runs on the Node.js runtime only. Edge middleware remains available (deprecated) for projects that need the Edge runtime; do not move such code to `proxy` without checking. Use the proxy for routing-level redirects/rewrites/headers, not as the only authorization layer.

## Caching

Set cache policy explicitly and check the installed version and config. Fetch caching and route prerendering are distinct: rendering depends on dynamic APIs, configuration, and Cache Components as well as data access. `cacheComponents: true` is opt-in and enables `"use cache"`, `cacheLife`, and `cacheTag`.

Invalidate after mutations, never during rendering:

- `updateTag(tag)` immediately expires cached data; the next read waits for fresh data (read-your-writes). Server Actions only.
- `revalidateTag(tag, "max")` uses stale-while-revalidate in Server Actions or Route Handlers. The one-argument form is deprecated; pass a profile.
- Use `revalidatePath(path)` for path-based invalidation; `refresh()` refreshes uncached data.

## Server Actions

Treat every action as a public endpoint: validate input on the server (e.g. a schema parse, not `as string` casts) and authorize the caller inside the action.

## Route handlers

Validate request bodies with `unknown`-first parsing and authorize before mutating. Use `NextResponse.json(data, { status })`. `params` is awaited: `{ params }: { params: Promise<{ id: string }> }`.

## Tooling

- Turbopack is the default for `dev` and `build`; use `--webpack` only if the project depends on webpack-specific config.
- `next lint` is removed; run ESLint (or Biome) directly.
- React Compiler is stable but opt-in (`reactCompiler: true` plus `babel-plugin-react-compiler`); enable only when requested.
- `import "server-only"` guards server-only modules from client imports.
- Metadata: export `metadata` or `generateMetadata`; await `params` inside it.
