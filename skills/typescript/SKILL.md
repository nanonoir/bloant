---
name: typescript
description: "TypeScript strict-mode patterns: type design, unknown and narrowing, guards, utility types, type-only imports. Use when writing or reviewing TypeScript."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.0"
---

# TypeScript

Follow the project's `tsconfig` and existing conventions first. Docs: https://www.typescriptlang.org/docs/handbook/

## Literal unions and const objects

A literal union is fine when only the type is needed. Use an `as const` object when runtime values are also useful (iteration, lookup, validation, autocomplete).

```ts
type Role = "admin" | "user";

const STATUS = { ACTIVE: "active", INACTIVE: "inactive" } as const;
type Status = (typeof STATUS)[keyof typeof STATUS];
```

## Object shapes

Prefer `interface` for extendable object contracts and `type` for unions, mapped, and utility types. Inline nested shapes are fine when used once; extract a named type when reused or when it improves readability.

## unknown and narrowing

Avoid `any`. Use `unknown` at trust boundaries (JSON, `catch`, external input) and narrow before use, or parse with a schema library. Use generics for flexible typing.

```ts
function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}
```

## Type guards

A guard must verify every field of the type it promises, or return a weaker type.

```ts
interface Address { street: string; city: string }
interface User { id: string; name: string; address: Address }

function isAddress(v: unknown): v is Address {
  return (
    typeof v === "object" && v !== null &&
    typeof (v as Record<string, unknown>).street === "string" &&
    typeof (v as Record<string, unknown>).city === "string"
  );
}

function isUser(v: unknown): v is User {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return typeof r.id === "string" && typeof r.name === "string" && isAddress(r.address);
}
```

## Utility types

`Pick`, `Omit`, `Partial`, `Required`, `Readonly`, `Record`, `Extract`, `Exclude`, `NonNullable`, `ReturnType`, `Parameters`, `Awaited`. Prefer `satisfies` to check a value against a type without widening it.

## Type-only imports

Use `import type { User } from "./types"` or `import { createUser, type Config } from "./utils"` for types, especially with `verbatimModuleSyntax` or `isolatedModules`.
