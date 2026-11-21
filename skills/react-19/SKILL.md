---
name: react-19
description: "React 19 patterns: Actions, useActionState, use(), ref as prop, optional React Compiler. Use when writing or reviewing React 19 components."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.0"
---

# React 19

Follow the project's existing imports, lint rules, and conventions over the defaults below. Docs: https://react.dev/blog/2024/12/05/react-19

## Memoization and React Compiler

React Compiler is opt-in; check whether the project enables it before relying on it. Do not add `useMemo`/`useCallback`/`memo` by default, but keep or add them when measured cost or referential stability requires it (stable effect dependencies, memoized children, expensive computations). Preserve existing uses unless asked to remove them.

Never mutate props or state in render: `items.toSorted(...)` or `[...items].sort(...)`, not `items.sort(...)`.

## Server vs. Client Components

Server Components (default only in RSC frameworks such as Next.js App Router) can be async and fetch data directly. Add `"use client"` only for state, effects, event handlers, context consumers, or browser APIs. In plain React apps (e.g. Vite), all components are client components.

## use()

```tsx
import { use } from "react";

type CommentItem = { id: string; text: string };
function Comments({ promise }: { promise: Promise<CommentItem[]> }) {
  const comments = use(promise); // suspends; wrap in <Suspense>
  return comments.map((c) => <p key={c.id}>{c.text}</p>);
}
```

`use(Context)` may be called conditionally, unlike `useContext`. Pass promises created outside render (or from a Server Component), not new promises created during each client render.

## Actions and useActionState

The action receives the previous state, then the payload (`FormData` when used as a form action).

```tsx
import { useActionState } from "react";

type State = { error?: string; ok?: boolean };

async function save(prev: State, formData: FormData): Promise<State> {
  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) return { error: "Name is required" };
  await saveName(name.trim());
  return { ok: true };
}

function NameForm() {
  const [state, action, isPending] = useActionState(save, {});
  return (
    <form action={action}>
      <label>Name <input name="name" /></label>
      {state.error && <p role="alert">{state.error}</p>}
      <button disabled={isPending}>{isPending ? "Saving..." : "Save"}</button>
    </form>
  );
}
```

Also available: `useFormStatus` (child of a form), `useOptimistic`.

## ref as prop

Function components receive `ref` as a regular prop; `forwardRef` is no longer needed in new code (existing uses still work).

```tsx
import type { ComponentProps } from "react";

function Input({ ref, ...props }: ComponentProps<"input">) {
  return <input ref={ref} {...props} />;
}
```

## Imports

Use the project's convention. With the automatic JSX runtime, `import React` is unnecessary; prefer named imports (`import { useState } from "react"`) unless the codebase does otherwise.
