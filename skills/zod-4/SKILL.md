---
name: zod-4
description: "Zod 4 schema validation: top-level formats, unified error option, issues, coercion, input/output types. Use when writing or migrating Zod schemas."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.0"
---

# Zod 4

Check the installed `zod` version first; these notes apply to Zod 4 (`import { z } from "zod"`). Docs: https://zod.dev/v4 and https://zod.dev/v4/changelog

## Migration from Zod 3

| Zod 3 | Zod 4 |
| --- | --- |
| `z.string().email()` / `.uuid()` / `.url()` | Preferred: `z.email()`, `z.uuid()`, `z.url()` (method forms are deprecated, still work) |
| `{ message: "..." }` | Preferred: `{ error: "..." }` or a string (`message` is deprecated, still works) |
| `required_error`, `invalid_type_error`, `errorMap` constructor options | Removed; use `error` (string or function) |
| `error.errors` | Removed; use `error.issues` |
| `z.ZodIssueCode.custom` | Deprecated; use `code: "custom"` |
| `z.record(valueSchema)` | `z.record(keySchema, valueSchema)` required |

`z.string().nonempty()` remains valid as an alias for `.min(1)` (preferred). `z.array(...).nonempty()` remains runtime-valid but infers `T[]`, not `[T, ...T[]]`.

## Errors

```ts
const schema = z.object({
  name: z.string({ error: "Name must be a string" }).min(1, "Name is required"),
  email: z.email("Invalid email address"),
  age: z.number().int().min(18, { error: "Must be 18 or older" }),
});

const result = schema.safeParse(data);
if (!result.success) {
  result.error.issues; // [{ code, path, message }]
  z.flattenError(result.error); // { formErrors, fieldErrors } for flat forms
  z.treeifyError(result.error); // nested structure
  z.prettifyError(result.error); // readable string
}
```

An `error` function receives the issue; return `undefined` to fall back to the default message. Ensure error messages match their constraints.

`.optional()` is `T | undefined`, `.nullable()` is `T | null`, `.nullish()` both; `.default(v)` applies when the input is `undefined`.

## Input and output types

`z.input<typeof schema>` and `z.output<typeof schema>` are static type utilities (no runtime effect) for schemas whose input and output differ (transforms, defaults, coercion). `z.infer` equals `z.output`.

## Coercion, transforms, refinements

```ts
const email = z.email().transform((v) => v.toLowerCase());

// Coercion uses JS constructors: Number("") is 0 and Number(" ") is 0.
// For form input, treat blank strings explicitly:
const age = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.coerce.number().int().min(0),
);

const signup = z
  .object({ password: z.string().min(8), confirm: z.string() })
  .refine((d) => d.password === d.confirm, {
    error: "Passwords don't match",
    path: ["confirm"],
  });
```

For multiple issues, use `.superRefine((data, ctx) => ctx.addIssue({ code: "custom", message, path }))`. For `z.coerce.*`, the input type is `unknown`; validate untrusted values with `safeParse` at the boundary.

## Forms

React Hook Form with `@hookform/resolvers/zod` is one option, not a requirement. Use the project's form stack. Form values arrive as strings and `FormData` entries; normalize blanks before coercion, and revalidate on the server.
